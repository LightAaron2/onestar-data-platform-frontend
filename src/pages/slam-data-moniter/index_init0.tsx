// 此版本可动态展示slam数据和视频流

import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Badge, Card, Descriptions, Divider, Row, Col, Button, message, Steps, Select } from 'antd';
import type { FC } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { XyzData, QData } from './data';
import { queryBasicProfile, getSlamData } from './service';
import useStyles from './style.style';
import { ApiOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Step } = Steps; //JINDUTIAO

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

// export interface TaskItem {
//   id: string;
//   title: string;
//   percent: number;            // 0~100
//   status: TaskStatus;
//   priority?: TaskPriority;
//   etaMinutes?: number;        // 预计剩余分钟
//   dueAt?: string;             // ISO 字符串
//   updatedAt?: string;         // ISO 字符串
//   meta?: Record<string, any>;
// }

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
  const mjpegRef = useRef<HTMLImageElement | null>(null);  //左手-RGB
  const mjpegObjectUrlRef = useRef<string | null>(null); // ADD: 追踪 snapshot blob URL，断开时 revoke
  const mjpegRef_head = useRef<HTMLImageElement | null>(null);
  const tof_mjpegRef = useRef<HTMLImageElement | null>(null); //左手-TOF

  // LIANJIE_CHG: 独立引用，避免多个 <img> 复用同一个 ref 导致刷新异常
  const headRgbRef = useRef<HTMLImageElement | null>(null);             // 头戴-RGB
  const headTofRef = useRef<HTMLImageElement | null>(null);             // 头戴-TOF
  const rightRgbRef = useRef<HTMLImageElement | null>(null);            // 右手-RGB
  const rightTofRef = useRef<HTMLImageElement | null>(null);            // 右手-TOF

  // ===== 录制状态与结果 =====
  const [recording, setRecording] = useState<boolean>(false);
  const [lastFile, setLastFile] = useState<string>('');

  const { styles } = useStyles();

  const {Option} = Select;

  // 仍保留基础信息请求
  const { data, loading } = useRequest(() => {
    return queryBasicProfile();
  });

  // 将后端 {timestamp, data:[x,y,z,qx,qy,qz,qw]} 格式化为页面需要的 xyzData / qData
  const formatPacket = useMemo(() => {
    return (pkt: { timestamp: number; data: number[] }) => {
      const ts = pkt.timestamp;
      const d = pkt.data || [];
      const tstr = new Date(ts * 1000).toISOString().replace('T', ' ').slice(0, 19);
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
      try { esRef.current.close(); } catch { }
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
    if (tof_mjpegRef.current) {         // 一并清理 TOF 左手
      tof_mjpegRef.current.onerror = null;
      tof_mjpegRef.current.src = '';
    }
    if (mjpegObjectUrlRef.current) {
      try { URL.revokeObjectURL(mjpegObjectUrlRef.current); } catch { }
      mjpegObjectUrlRef.current = null;
    }
  };
  // === 进度条状态 === // JINDUTIAO
  const [currentStep, setCurrentStep] = useState<number>(0);

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
          console.log('mergedsis:');
          setMergedData(merged);
          setXyzData(xyz);
          setQData(q);
        } catch (e) {
          // 忽略解析错误（可能是心跳）
        }
      };

      es.onerror = () => {
        // SSE 不通则关闭并回退到轮询（前提仍处于连接状态）
        try { es?.close(); } catch { }
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
              console.log('else if' + xyzData);
              const merged = [{
                X: res.data.xyzData[0]['value'],
                Y: res.data.xyzData[1]['value'],
                Z: res.data.xyzData[2]['value'],
                QX: res.data.qData[0]['value'],
                QY: res.data.qData[1]['value'],
                QZ: res.data.qData[2]['value'],
                QW: res.data.qData[3]['value'],
                time: res.data.xyzData[0]['time']

              }]
              console.log('mergedsis:');
              setMergedData(merged);
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
      cleanupStreams();
      cleanupMjpeg();
      setCurrentStep(0);
      return;
    } else if (connect && !recording) setCurrentStep(1);  // 已连接 -> B
    else if (connect && recording) setCurrentStep(2);

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
    if (tof_mjpegRef.current && connect) {  // CHG: 仅连接时刷新/api/v0/video/tof/mjpeg
      tof_mjpegRef.current.src = `${API_BASE}/api/v0/video/tof/mjpeg`;
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
    } catch (e: any) {
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
    } catch (e: any) {
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

  const title =  (
    <div> 
     {currentStep === 0 && <div>设备状态：停止 <Badge status="error"  /></div> }
     {currentStep !== 0 && <div>设备状态：正常 <Badge status="success" /></div>}
    </div>
  )
  useEffect(()=>{
    const isTypingTarget = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return (
        tag === 'input' ||
        tag === 'textarea' ||
        el.isContentEditable
      );
    };
    const onKeyDown = (e: KeyboardEvent) => {
      // KEYBIND_GUARD: 忽略长按重复与输入场景
      if (e.repeat) return;
      if (isTypingTarget(e.target)) return;

      // 统一大小写
      const key = e.key.toLowerCase();

      // 空格：第一次=连接；第二次=断开（采集中禁止断开，保持与按钮一致）
      if (key === ' ' || key === 'spacebar') {
        e.preventDefault(); // 避免页面滚动
        if (!connect) {
          handleConnect(); // 连接
        } else if (connect && !recording) {
          handleConnect(); // 断开（只有未录制时允许）
        } else {
          // 录制中按空格不做事，保持与按钮禁用一致
        }
      }

      // Y 键：第一次=开始采集；第二次=停止采集（需已连接）
      if (key === 'y') {
        if (connect && !recording) {
          void handleStart();
        } else if (recording) {
          void handleStop();
        } else {
          // 未连接时按 y 不做事，与按钮禁用一致
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [connect, recording]); // KEYBIND_DEP: 跟随状态更新

  const [robotId, setRobotId] = useState<string>('0001');
  
  return (
    <PageContainer title={title}>
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
          <Col sm={4} xs={24} style={{ textAlign: 'center', alignSelf: 'center' }} >
            {connect === false && (
              <Button
                type="primary"
                icon={<ApiOutlined />}
                className={styles.linearGradientButton}
                size="large"
                style={{ width: 175 }}
                onClick={handleConnect}
                disabled={recording}
              >
                连接设备
              </Button>
            )}
            {connect === true && (
              <Button
                danger
                type="primary"
                icon={<CloseCircleOutlined />}
                size="large"
                style={{ width: 175 }}
                onClick={handleConnect}
                disabled={recording}
              >
                断开设备
              </Button>
            )}
          </Col>
          <Col sm={4} xs={24} style={{ textAlign: 'center', alignSelf: 'center' }}>
            <Button type="primary" size="large" style={{ width: 150 }}
              onClick={handleStart} disabled={recording || !connect}   // 未连接时禁用
            >开始采集</Button>
          </Col>
          <Col sm={4} xs={24} style={{ textAlign: 'center', alignSelf: 'center' }}>
            <Button size="large" danger style={{ width: 150 }}
              onClick={handleStop} disabled={!recording}
            >停止采集</Button>
          </Col>
          <Col sm={2} xs={24}>
      <div style={{ border: '1px solid #f0f0f0', padding: 8, borderRadius: 4 }}>
        <div style={{ marginBottom: 4, fontWeight: 500 }}>机器人编号</div>
        <Select
          value={robotId}
          style={{ width: '100%' }}
          placeholder="选择或输入机器人编号"
          showSearch
          bordered={false} 
          allowClear
          onChange={(val) => setRobotId(val)}
          onSearch={(val) => setRobotId(val)} // 手动输入时更新
        >
          <Option value="0001">0001</Option>
          <Option value="0002">0002</Option>
          <Option value="0003">0003</Option>
          <Option value="0004">0004</Option>
        </Select>
      </div>
    </Col>
          <Col sm={2} xs={24}>
            <Info title="连接状态" value={connText} bordered />
          </Col>
          <Col sm={2} xs={24}>
            <Info title="激光传感器状态" value={connText} bordered />
          </Col>
          <Col sm={2} xs={24}>
            <Info title="视觉里程计状态" value={connText} bordered />
          </Col>
          <Col sm={2} xs={24}>
            <Info title="视频流状态" value={connText} bordered />
          </Col>
          <Col sm={2} xs={24}>
            <Info title="深度传感器状态" value={connText} bordered />
          </Col>
        </Row>
        <Row>
        <Col sm={20} xs={10} offset={2} style={{ marginTop: 40 }}>
            {/* ADD: 三步进度条 */}
            <Steps current={currentStep} size="small">
              <Step title="A" description="未连接" />
              <Step title="B" description="已连接" />
              <Step title="C" description="采集中" />
            </Steps>
          </Col>
        </Row>
      </Card>

      {/* ======= 视频区域 ======= */}
      <Card variant="borderless" style={{ marginTop: 8 }}> {/* CHG: 24 -> 8 缩小视频区块上方空白 */}
        <Divider style={{ marginBottom: 8 }} />           {/* CHG: 32 -> 8 再次压缩上方留白 */}

        {/* 容器 Card：去掉 body 内边距，避免额外空白 */}
        <Card variant="borderless" style={{ marginTop: 0 }} bodyStyle={{ padding: 0 }}> {/* ADD bodyStyle:0 */}
          {/* 三列网格：无列/行间距，视频块紧贴 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',   // CHG: 去掉中间空列
              columnGap: 0,                             // CHG: 列间距 0
              rowGap: 0,                                // CHG: 行间距 0
              alignItems: 'start',
            }}
          >
            {/* ===== 组1（列1）===== */}
            <Card variant="borderless" style={{ marginTop: 0 }} bodyStyle={{ padding: 0 }}>  {/* ADD bodyStyle:0 */}
              <Descriptions
                title="左手-RGB"
                size="small"
                style={{ marginBottom: 0 }}
                styles={{ header: { marginBottom: 0 }, content: { margin: 0, padding: 0 } }}  // ADD
              >
                <div style={{ width: '100%', lineHeight: 0 }}>  {/* ADD: lineHeight:0 去掉行高缝隙 */}
                  {connect ? (
                    <img
                      ref={mjpegRef}  
                      alt="video-1-top"
                      style={{ width: '100%', height: 300, objectFit: 'contain', backgroundColor: 'black', display: 'block' }}  /* CHG: display:block 彻底贴合 */
                    />
                  ) : (
                    <div style={{ width: '100%', height: 300, backgroundColor: 'black', color: 'white', lineHeight: '300px' }}>
                      <span style={{ marginLeft: 5, fontSize: 15 }}>未连接.... 点击上方 “连接设备” 开始视频流</span>
                    </div>
                  )}
                </div>
              </Descriptions>

              <Descriptions
                title="左手-TOF"
                size="small"
                style={{ marginBottom: 0 }}
                styles={{ header: { marginBottom: 0 }, content: { margin: 0, padding: 0 } }}  // ADD
              >
                <div style={{ width: '100%', lineHeight: 0 }}>
                  {connect ? (
                    <img
                      ref={tof_mjpegRef}
                      alt="video-1-bottom"
                      src="http://localhost:8888/api/v0/video/tof/mjpeg"
                      style={{ width: '100%', height: 300, objectFit: 'contain', backgroundColor: 'black', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: 300, backgroundColor: 'black', color: 'white', lineHeight: '300px' }}>
                      <span style={{ marginLeft: 5, fontSize: 15 }}>未连接.... 点击上方 “连接设备” 开始视频流</span>
                    </div>
                  )}
                </div>
              </Descriptions>
            </Card>

            {/* ===== 组2（列2）===== */}
            <Card variant="borderless" style={{ marginTop: 0 }} bodyStyle={{ padding: 0 }}>
              <Descriptions
                title="头戴-RGB"
                size="small"
                style={{ marginBottom: 0 }}
                styles={{ header: { marginBottom: 0 }, content: { margin: 0, padding: 0 } }}
              >
                <div style={{ width: '100%', lineHeight: 0 }}>
                  {connect ? (
                    <img
                      ref={headRgbRef}
                      alt="video-2-top"
                      // src={`${API_BASE}/api/v0/video/mjpeg?cb=${Date.now()}`}
                      style={{ width: '100%', height: 300, objectFit: 'contain', backgroundColor: 'black', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: 300, backgroundColor: 'black', color: 'white', lineHeight: '300px' }}>
                      <span style={{ marginLeft: 5, fontSize: 15 }}>未连接.... 点击上方 “连接设备” 开始视频流</span>
                    </div>
                  )}
                </div>
              </Descriptions>

              <Descriptions
                title="头戴-TOF"
                size="small"
                style={{ marginBottom: 0 }}
                styles={{ header: { marginBottom: 0 }, content: { margin: 0, padding: 0 } }}
              >
                <div style={{ width: '100%', lineHeight: 0 }}>
                  {connect ? (
                    <img
                      ref={headTofRef}
                      alt="video-2-bottom"
                      // src={`${API_BASE}/api/v0/video/mjpeg?cb=${Date.now()}`}
                      style={{ width: '100%', height: 300, objectFit: 'contain', backgroundColor: 'black', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: 300, backgroundColor: 'black', color: 'white', lineHeight: '300px' }}>
                      <span style={{ marginLeft: 5, fontSize: 15 }}>未连接.... 点击上方 “连接设备” 开始视频流</span>
                    </div>
                  )}
                </div>
              </Descriptions>
            </Card>

            {/* ===== 组3（列3）===== */}
            <Card variant="borderless" style={{ marginTop: 0 }} bodyStyle={{ padding: 0 }}>
              <Descriptions
                title="右手-RGB"
                size="small"
                style={{ marginBottom: 0 }}
                styles={{ header: { marginBottom: 0 }, content: { margin: 0, padding: 0 } }}
              >
                <div style={{ width: '100%', lineHeight: 0 }}>
                  {connect ? (
                    <img
                      ref={rightRgbRef}
                      alt="video-3-top"
                      // src={`${API_BASE}/api/v0/video/mjpeg?cb=${Date.now()}`}
                      style={{ width: '100%', height: 300, objectFit: 'contain', backgroundColor: 'black', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: 300, backgroundColor: 'black', color: 'white', lineHeight: '300px' }}>
                      <span style={{ marginLeft: 5, fontSize: 15 }}>未连接.... 点击上方 “连接设备” 开始视频流</span>
                    </div>
                  )}
                </div>
              </Descriptions>

              <Descriptions
                title="右手-TOF"
                size="small"
                style={{ marginBottom: 0 }}
                styles={{ header: { marginBottom: 0 }, content: { margin: 0, padding: 0 } }}
              >
                <div style={{ width: '100%', lineHeight: 0 }}>
                  {connect ? (
                    <img
                      ref={rightTofRef}
                      alt="video-3-bottom"
                      // src={`${API_BASE}/api/v0/video/mjpeg?cb=${Date.now()}`}
                      style={{ width: '100%', height: 300, objectFit: 'contain', backgroundColor: 'black', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: 300, backgroundColor: 'black', color: 'white', lineHeight: '300px' }}>
                      <span style={{ marginLeft: 5, fontSize: 15 }}>未连接.... 点击上方 “连接设备” 开始视频流</span>
                    </div>
                  )}
                </div>
              </Descriptions>
            </Card>
          </div>
        </Card>

        <div className={styles.title}>SLAM 数据</div>
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
