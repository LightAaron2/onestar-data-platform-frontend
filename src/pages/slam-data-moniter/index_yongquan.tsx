// 此版本可动态展示slam数据和视频流

import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Badge, Card, Descriptions, Divider, Row, Col, Button, message } from 'antd'; 
import type { FC } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react'; 
import type { XyzData, QData } from './data';
import { queryBasicProfile, getSlamData } from './service';  
import useStyles from './style.style';
import { ApiOutlined, CloseCircleOutlined } from '@ant-design/icons';

const progressColumns: ProColumns<QData>[] = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    align: 'left',
    hideInTable: true,
  },
  {
    title: '时间',
    dataIndex: 'time',
    key: 'time',
    align: 'left'
  },
  {
    title: '姿态四元数',
    dataIndex: 'name',
    key: 'name',
    align: 'left'
  },
  {
    title: '数值',
    dataIndex: 'value',
    key: 'value',
    align: 'left'
  },
];

const API_BASE = 'http://localhost:8888';

const Info: FC<{
  title: React.ReactNode;
  value: React.ReactNode;
  bordered?: boolean;
}> = ({ title, value, bordered }) => {
  const { styles } = useStyles();
  return (
    <div className={styles.headerInfo}>
      <span>{title}</span>
      <p>{value}</p>
      {bordered && <em />}
    </div>
  );
};

const SlamDataMoniter: FC = () => {
  const [xyzData, setXyzData] = useState<XyzData[]>([])
  const [qData, setQData] = useState<QData[]>([])
  const [mergedData, setMergedData] = useState<any[]>([])

  // 连接与模式状态
  const [connMode, setConnMode] = useState<'idle' | 'sse' | 'poll'>('idle'); 
  const [connOk, setConnOk] = useState<boolean>(false); 
  const stopFlagRef = useRef<boolean>(false); 
  const pollLoopRef = useRef<Promise<void> | null>(null); 
  const esRef = useRef<EventSource | null>(null); 
  const [connect, setConnect] = useState<boolean>(false); 

  // MJPEG <img> 引用
  const mjpegRef = useRef<HTMLImageElement | null>(null); 
  const mjpegObjectUrlRef = useRef<string | null>(null); // ADD: 追踪 snapshot blob URL，断开时 revoke

  // ===== 录制状态与结果 =====
  const [recording, setRecording] = useState<boolean>(false);
  const [lastFile, setLastFile] = useState<string>('');

  const { styles } = useStyles();

  // 仍保留基础信息请求
  const { data, loading } = useRequest(() => {
    return queryBasicProfile();
  });

  // 将后端 {timestamp, data:[x,y,z,qx,qy,qz,qw]} 格式化为页面需要的 xyzData / qData
  const formatPacket = useMemo(() => {
    return (pkt: { timestamp: number; data: number[] }) => {
      const ts = pkt.timestamp;
      const d = pkt.data || [];
      const tstr = new Date(ts * 1000).toISOString().replace('T',' ').slice(0,19);
      const _xyz: XyzData[] = [
        { id: '1', name: '坐标X', value: (d[0] ?? 0).toFixed(4), time: tstr },
        { id: '2', name: '坐标Y', value: (d[1] ?? 0).toFixed(4), time: tstr },
        { id: '3', name: '坐标Z', value: (d[2] ?? 0).toFixed(4), time: tstr },
      ];
      const _q: QData[] = [
        { id: '1', name: 'QX', value: (d[3] ?? 0).toFixed(4), time: tstr },
        { id: '2', name: 'QY', value: (d[4] ?? 0).toFixed(4), time: tstr },
        { id: '3', name: 'QZ', value: (d[5] ?? 0).toFixed(4), time: tstr },
        { id: '4', name: 'QW', value: (d[6] ?? 0).toFixed(4), time: tstr },
      ];
      return { xyz: _xyz, q: _q };
    }
  }, []);

  // const mergedData = xyzData.map((xyz, index) =>{
  //   const q = qData[index];
  //   return {
  //     ...xyz,
  //     ...q,
  //   }
  // })

  // === 封装：数据流清理（SSE/轮询） === // ADD
  const cleanupStreams = () => {
    stopFlagRef.current = true;
    if (esRef.current) {
      try { esRef.current.close(); } catch {}
      esRef.current = null;
    }
    pollLoopRef.current = null;
    setConnMode('idle');
    setConnOk(false);
  };

  // === 封装：视频流清理（MJPEG） === // ADD
  const cleanupMjpeg = () => {
    const img = mjpegRef.current;
    if (img) {
      img.onerror = null;               // 防止断开时触发错误逻辑
      img.src = '';                     // 断开流
    }
    if (mjpegObjectUrlRef.current) {
      try { URL.revokeObjectURL(mjpegObjectUrlRef.current); } catch {}
      mjpegObjectUrlRef.current = null;
    }
  };

  // === 根据 connect 控制：SSE 首选，失败回退到长轮询 === // CHG: 仅在 connect=true 时启动，connect=false 时立即清理
  useEffect(() => {
    if (!connect) {           // 断开：立刻停源
      cleanupStreams();
      return;
    }

    stopFlagRef.current = false;

    // 优先使用 SSE（/api/v0/data/stream） // 你可根据后端改为 /test/api/v0/data/sse
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/v0/data/sse'); // CHG：只在连接时创建
      esRef.current = es;
      setConnMode('sse');

      es.onopen = () => {
        if (stopFlagRef.current) return;
        setConnOk(true);
      };

      es.onmessage = (ev) => {
        if (stopFlagRef.current) return;
        try {
          const pkt = JSON.parse(ev.data); // {timestamp, data:[...]}
          const { xyz, q } = formatPacket(pkt);

          const merged = [{  
            X: xyz[0]['value'], 
            Y: xyz[1]["value"], 
            Z: xyz[2]['value'],
            QX: q[0]['value'],
            QY: q[1]['value'],
            QZ: q[2]['value'],
            QW: q[3]['value'],
            time: xyz[0]['time']
          }]
          setMergedData(merged)
          setXyzData(xyz);
          setQData(q);
        } catch (e) {
          // 忽略解析错误（可能是心跳）
        }
      };

      es.onerror = () => {
        // SSE 不通则关闭并回退到轮询（前提仍处于连接状态）
        try { es?.close(); } catch {}
        esRef.current = null;
        if (!stopFlagRef.current) startPolling(); // ADD: 仅在未停止时回退
      };
    } catch {
      startPolling();
    }

    function startPolling() {
      if (stopFlagRef.current) return;
      setConnMode('poll');
      setConnOk(true);

      const loop = async () => {
        while (!stopFlagRef.current) {
          try {
            const res: any = await getSlamData();
            if (res?.xyzData && res?.qData) {
              setXyzData(res.xyzData);
              setQData(res.qData);
            } else if (res?.data?.xyzData && res?.data?.qData) {
              setXyzData(res.data.xyzData);
              setQData(res.data.qData);
            }
          } catch (e) {
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      };
      const p = loop();
      pollLoopRef.current = p as unknown as Promise<void>;
    }

    // 清理（连接状态变更或组件卸载）
    return () => {
      cleanupStreams();
    };
  }, [connect, formatPacket]); // CHG: 依赖 connect

  // === 根据 connect 控制：挂载/取消 MJPEG 视频流 === // CHG
  useEffect(() => {
    if (!connect) {
      cleanupMjpeg();
      return;
    }

    const img = mjpegRef.current;
    if (!img) return;

    img.onerror = () => {
      // 如果 MJPEG 出错，尝试一次快照（仅在仍连接时）
      // if (!connect) return;
      // fetch(`/test/api/v0/video/snapshot`)
      //   .then(async (r) => {
      //     if (!connect) return;
      //     if (r.status === 204) {
      //       message.warning('未检测到视频帧，请确认相机话题是否发布');
      //     } else {
      //       const blob = await r.blob();
      //       const url = URL.createObjectURL(blob);
      //       mjpegObjectUrlRef.current = url;
      //       if (mjpegRef.current) {
      //         mjpegRef.current.src = url;
      //       }
      //     }
      //   })
      //   .catch(() => {});
    };

    // 启动 MJPEG
    img.src = `${API_BASE}/api/v0/video/mjpeg?cb=${Date.now()}`;

    // 清理（断开或卸载）
    return () => {
      cleanupMjpeg();
    };
  }, [connect]); // CHG: 依赖 connect

  const { basicGoods, basicProgress } = data || {
    basicGoods: [],
    basicProgress: [],
  };
  let goodsData: typeof basicGoods = [];

  if (basicGoods.length) {
    goodsData = basicGoods
  }

  const renderContent = (value: any, _: any, index: any) => {
    const obj: {
      children: any;
      props: {
        colSpan?: number;
      };
    } = {
      children: value,
      props: {},
    };
    if (index === basicGoods.length) {
      obj.props.colSpan = 0;
    }
    return obj;
  };

  const xyzColumns: ProColumns<XyzData>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      align: 'left',
      hideInTable: true,
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      align: 'left'
    },
    {
      title: '姿态四元数',
      dataIndex: 'name',
      key: 'name',
      align: 'left'
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      align: 'left' as 'left' | 'right' | 'center',
      render: renderContent,
    },
  ];

  const dataColumns: ProColumns<XyzData>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      align: 'left',
      hideInTable: true,
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      align: 'left'
    },
    {
      title: '参数名',
      dataIndex: 'name',
      key: 'name',
      align: 'left'
    },
    {
      title: '参数值',
      dataIndex: 'value',
      key: 'value',
      align: 'left' as 'left' | 'right' | 'center',
      render: renderContent,
    },
  ];
  const mergedColumns: ProColumns<any>[] = [
    // {
    //   title: 'ID',
    //   dataIndex: 'id',
    //   key: 'id',
    //   align: 'left',
    // },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      align: 'left'
    },
    {
      title: '坐标X',
      dataIndex: 'X',
      key: 'X',
      align: 'left',
    },
    {
      title: '坐标Y',
      dataIndex: 'Y',
      key: 'Y',
      align: 'left',
    },
    {
      title: '坐标Z',
      dataIndex: 'Z',
      key: 'Z',
      align: 'left',
    },
    {
      title: 'QX',
      dataIndex: 'QX',
      key: 'QX',
      align: 'left',
    },
    {
      title: 'QY',
      dataIndex: 'QY',
      key: 'QY',
      align: 'left',
    },
    {
      title: 'QZ',
      dataIndex: 'QZ',
      key: 'QZ',
      align: 'left',
    },
    {
      title: 'QW',
      dataIndex: 'QW',
      key: 'QW',
      align: 'left',
    },
  ];
  
  // 连接状态展示
  const connText = useMemo(() => {
    if (!connect) return '未连接';          // CHG
    if (!connOk) return '连接中…';
    if (connMode === 'sse') return '已连接（SSE 实时）';
    if (connMode === 'poll') return '已连接（长轮询）';
    return '已连接';
  }, [connect, connOk, connMode]); // CHG

  //当前时间
  const [nowStr, setNowStr] = useState<string>('');
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setNowStr(d.toLocaleTimeString());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  //操作按钮事件
  const refreshVideo = () => { 
    if (mjpegRef.current && connect) {  // CHG: 仅连接时刷新
      mjpegRef.current.src = `${API_BASE}/test/api/v0/video/mjpeg?cb=${Date.now()}`;
    }
  };

  const handleConnect = () => {
    // CHG: 切换连接状态；断开动作由 useEffect 自动清理所有流
    setConnect((prev) => !prev);
  };

  // === 录制控制：开始 ===
  const handleStart = async () => {
    try {
      const r = await fetch('/test/api/v0/record/start', { method: 'POST' });
      const j = await r.json();
      if (j?.ok) {
        setRecording(true);
        message.success(`开始采集，文件：${j.file || ''}`);
      } else {
        message.error('开始采集失败');
      }
    } catch (e:any) {
      message.error(`开始采集异常：${e?.message || e}`);
    }
  };

  // === 录制控制：停止并保存 ===
  const handleStop = async () => {
    try {
      const r = await fetch('/test/api/v0/record/stop', { method: 'POST' });
      const j = await r.json();
      if (j?.ok) {
        setRecording(false);
        setLastFile(j.file || '');
        message.success(`已停止并保存：${j.file || ''}`);
      } else {
        message.error('停止保存失败');
      }
    } catch (e:any) {
      message.error(`停止保存异常：${e?.message || e}`);
    }
  };

  // === 访问最近保存的 HDF5 ===
  const handleOpenH5 = () => {
    if (!lastFile) {
      message.info('暂无可访问的HDF5，请先停止采集生成文件');
      return;
    }
    const url = `/test/api/v0/record/download?file=${encodeURIComponent(lastFile)}`;
    window.open(url, '_blank');
  };

  return (
    <PageContainer
    title="设备状态：正常"
    >
      {/* <Card>
        <Row>
          <Col sm={8} xs={24}>
            <Info title="连接状态" value={connText} bordered /> 
          </Col>
          <Col sm={8} xs={24}>
            <Info title="机器人编号" value="0001" bordered />
          </Col>
          
        </Row>
      </Card> */}

      <Card style={{ marginTop: 24 }}>
        <Row>
           <Col sm={3} xs={24}>
            <Info title="连接状态" value={connText} bordered /> 
          </Col>
          <Col sm={3} xs={24}>
            <Info title="机器人编号" value="0001" bordered />
          </Col>
          <Col sm={6} xs={24} style={{textAlign: 'center', alignSelf: 'center'}} >
            { connect === false && (
              <Button
                type="primary"
                icon={<ApiOutlined />}
                className={styles.linearGradientButton}
                size="large"
                style={{width: 175}}
                onClick={handleConnect}
                disabled={recording}
              >
                连接设备
              </Button>
            )}
            { connect === true && (
              <Button
                danger
                type="primary"
                icon={<CloseCircleOutlined />}
                size="large"
                style={{width: 175}}
                onClick={handleConnect}
                disabled={recording}
              >
                断开设备
              </Button>
            )}
          </Col>
          <Col sm={6} xs={24} style={{textAlign: 'center', alignSelf: 'center'}}>
            <Button type="primary" size="large" style={{width: 150}}
              onClick={handleStart} disabled={recording || !connect}   // CHG: 未连接时禁用
            >开始采集</Button>
          </Col>
          <Col sm={6} xs={24} style={{textAlign: 'center', alignSelf: 'center'}}>
            <Button size="large" danger style={{width: 150}}
              onClick={handleStop} disabled={!recording}
            >停止采集</Button>
          </Col>
        </Row>
        {/* <Row style={{marginTop: 12}}>
          <Col sm={25}  style={{textAlign:'center'}}>
            {recording ? <Badge status="processing" text="录制中…" /> : <Badge status="default" text="未录制" />}
            {lastFile ? <div style={{marginTop:8}}>最近文件：{lastFile}</div> : null}
          </Col>
        </Row> */}
      </Card>

      <Card variant="borderless" style={{ marginTop: 24 }}>
        <Descriptions title="视频流" style={{ marginBottom: 32 }}>
          {/* <div id="video-container" style={{ display: "relative"}} >
            {connect && <img
              ref={mjpegRef}
              alt="video"
              style={{ display: "relative", width: "100%", height: 600, objectFit: 'contain', backgroundColor: 'black'}}
            />}
            {!connect && (
              <div style={{width: "100%", height: 600, backgroundColor: 'black', color: 'white'}} id="video-placeholder">
                  <span style={{marginLeft:5,fontSize:15}}>未连接.... 点击上方 “连接设备” 开始视频流</span>
              </div>
            )}
          </div> */}

        <Card variant="borderless" style={{ marginTop: 24 }}>
          <Descriptions title="左手" style={{ marginBottom: 32 }}>
            <div id="video-container" style={{ display: "relative"}} >
              {/* 用 <img> 承载 MJPEG */}
              {connect && <img
                ref={mjpegRef}
                alt="video"
                style={{ display: "relative", width: "100%", height: 600, objectFit: 'contain', backgroundColor: 'black'}}
              />}
              {!connect && (
                // <div style={{ display: "absoulte", left: 0, top: 0, marginTop: 8, color: '#999'}}>未连接，点击上方“连接设备”开始视频流</div> 
                <div style={{width: "100%", height: 600, backgroundColor: 'black', color: 'white'}} id="video-placeholder">
                    <span style={{marginLeft:5,fontSize:15}}>未连接.... 点击上方 “连接设备” 开始视频流</span>
                </div>
              )}
            </div>
          </Descriptions>
        </Card>
        <Card variant="borderless" style={{ marginTop: 24 }}>
          <Descriptions title="头戴" style={{ marginBottom: 32 }}>
            <div id="video-container" style={{ display: "relative"}} >
              {/* 用 <img> 承载 MJPEG */}
              {connect && <img
                // ref={mjpegRef}
                alt="video"
                style={{ display: "relative", width: "100%", height: 600, objectFit: 'contain', backgroundColor: 'black'}}
              />}
              {!connect && (
                // <div style={{ display: "absoulte", left: 0, top: 0, marginTop: 8, color: '#999'}}>未连接，点击上方“连接设备”开始视频流</div> 
                <div style={{width: "100%", height: 600, backgroundColor: 'black', color: 'white'}} id="video-placeholder">
                    <span style={{marginLeft:5,fontSize:15}}>未连接.... 点击上方 “连接设备” 开始视频流</span>
                </div>
              )}
            </div>
          </Descriptions>
        </Card>
        <Card variant="borderless" style={{ marginTop: 24 }}>
          <Descriptions title="右手" style={{ marginBottom: 32 }}>
            <div id="video-container" style={{ display: "relative"}} >
              {/* 用 <img> 承载 MJPEG */}
              {connect && <img
                // ref={mjpegRef}
                alt="video"
                style={{ display: "relative", width: "100%", height: 600, objectFit: 'contain', backgroundColor: 'black'}}
              />}
              {!connect && (
                // <div style={{ display: "absoulte", left: 0, top: 0, marginTop: 8, color: '#999'}}>未连接，点击上方“连接设备”开始视频流</div> 
                <div style={{width: "100%", height: 600, backgroundColor: 'black', color: 'white'}} id="video-placeholder">
                    <span style={{marginLeft:5,fontSize:15}}>未连接.... 点击上方 “连接设备” 开始视频流</span>
                </div>
              )}
            </div>
          </Descriptions>
        </Card>
        </Descriptions>

        {/* <Descriptions style={{ marginBottom: 32 }} column={4}>
          <Descriptions.Item label="操作按键：">
            <Button size="large" onClick={refreshVideo} disabled={!connect}>刷新视频</Button> 
          </Descriptions.Item>
          <Descriptions.Item label="操作按键："><Button size="large" disabled={!connect}>检查状态</Button></Descriptions.Item>
          <Descriptions.Item label="操作按键："><Button size="large" disabled={!connect}>全屏模式</Button></Descriptions.Item>
          <Descriptions.Item label="操作按键："><Button size="large" disabled={!connect}>重置SLAM</Button></Descriptions.Item>
        </Descriptions> */}
        <Divider style={{ marginBottom: 32 }} />

        <div className={styles.title}>SLAM 数据</div>
         {/* <ProTable
          style={{ marginBottom: 24 }}
          pagination={false}
          search={false}
          loading={loading}
          options={false}
          toolBarRender={false}
          dataSource={xyzData}
          columns={xyzColumns}
          rowKey="id"
        />
        <ProTable
          style={{ marginBottom: 16 }}
          pagination={false}
          loading={loading}
          search={false}
          options={false}
          toolBarRender={false}
          dataSource={qData}
          columns={progressColumns}
          rowKey="id"
        /> 
        <ProTable
          style={{ marginBottom: 24, width: '50%' }}
          pagination={false}
          search={false}
          loading={loading}
          options={false}
          toolBarRender={false}
          dataSource={xyzData}
          columns={dataColumns}
          rowKey="id"
        /> */}
        <ProTable
          style={{ marginBottom: 24, width: '50%' }}
          pagination={false}
          search={false}
          loading={loading}
          options={false}
          toolBarRender={false}
          dataSource={mergedData}
          columns={mergedColumns}
          rowKey="id"
        />
      </Card>
    </PageContainer>
  );
};
export default SlamDataMoniter;