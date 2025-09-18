// index.tsx

// 此版本可动态展示slam数据和视频流

import { PageContainer, ProTable, ProColumns } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
// import { Badge, Card, Descriptions, Divider, Row, Col, Button, message } from 'antd';
import { Card, Descriptions, Divider, Row, Col, Button, message, Slider, Spin, Alert } from 'antd';
import type { FC } from 'react';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
// DUQUHDF5_002: 移除不再需要的 XyzData 和 QData 类型导入
// import type { XyzData, QData } from './data';
import { queryBasicProfile, getSlamData } from './service';
import useStyles from './style.style';
import { ApiOutlined, CloseCircleOutlined } from '@ant-design/icons';
// DUQUHDF5_001：引入useLocation
import { useLocation } from '@umijs/max';
import axios from 'axios';


const LOCAL_URL = "http://localhost:8888"

// 关键点 1: 定义统一的 SLAM 数据项类型，用于存放7个参数中的每一个
interface SlamDataItem {
  id: string;
  name: string;
  value: string;
  time: string;
}

//GAIDONG: 定义单帧数据的完整类型
interface FrameData {
  rgb_image?: string; // Base64 Data URL
  tof_image?: string; // Base64 Data URL
  slam_data?: {
    timestamp: number;
    data: number[];
  };
}

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

const SlamDataReview: FC = () => {
  // 关键点 2: 使用统一的 state `slamData` 来存储和管理全部7个SLAM参数。
  // 当这个 state 更新时，React 会自动重新渲染UI（表格）。
  const [slamData, setSlamData] = useState<SlamDataItem[]>([]);

  // 连接与模式状态
  // const [connMode, setConnMode] = useState<'idle' | 'sse' | 'poll'>('idle');
  const [connOk, setConnOk] = useState<boolean>(false);
  const stopFlagRef = useRef<boolean>(false);
  const pollLoopRef = useRef<Promise<void> | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const [connect, setConnect] = useState<boolean>(false);
  // DUQUHDF5_001：新增状态管理HDF5文件名
  //GAIDONG新增播放器核心状态
  const [hdf5File, setHdf5File] = useState<string | null>(null);
  const [totalFrames, setTotalFrames] = useState<number>(0);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [frameData, setFrameData] = useState<FrameData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // SEP1702: 新增自动播放状态和 interval 的 ref
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // MJPEG <img> 引用
  const mjpegRef = useRef<HTMLImageElement | null>(null);
  const mjpegObjectUrlRef = useRef<string | null>(null); // ADD: 追踪 snapshot blob URL，断开时 revoke

  // DUQUHDF5_001：新增TOFO 和 RGB 的 MJPEG 引用
  const mjpegTofRef = useRef<HTMLImageElement | null>(null);
  const mjpegHeadRgbRef = useRef<HTMLImageElement | null>(null);
  const mjpegHeadTofRef = useRef<HTMLImageElement | null>(null);
  const mjpegRightRgbRef = useRef<HTMLImageElement | null>(null);
  const mjpegRightTofRef = useRef<HTMLImageElement | null>(null);


  // ===== 录制状态与结果 =====
  const [recording, setRecording] = useState<boolean>(false);
  const [lastFile, setLastFile] = useState<string>('');

  const { styles } = useStyles();

  // DUQUHDF5_001：从URL中获取文件名
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const file = params.get('file');
    if (file) {
      console.log("if (file)...");
      setHdf5File(file);
      // setConnect(true); // 自动开始连接以播放HDF5文件
    }
  }, [location.search]);

  // 仍保留基础信息请求
  const { data, loading } = useRequest(() => {
    return queryBasicProfile();
  });

  // 关键点 3: 定义数据处理函数 `formatPacket`。
  // 它负责将从后端接收到的原始数据包 {timestamp, data:[...]} 格式化为符合表格要求的数组结构。
  const formatPacket = useMemo(() => {
    return (pkt: { timestamp: number; data: number[] }) => {
      const ts = pkt.timestamp;
      const d = pkt.data || [];
      const tstr = new Date(ts * 1000).toISOString().replace('T', ' ').slice(0, 19);
      const _slamData: SlamDataItem[] = [
        { id: '1', name: '坐标X', value: (d[0] ?? 0).toFixed(4), time: tstr },
        { id: '2', name: '坐标Y', value: (d[1] ?? 0).toFixed(4), time: tstr },
        { id: '3', name: '坐标Z', value: (d[2] ?? 0).toFixed(4), time: tstr },
        { id: '4', name: 'QX', value: (d[3] ?? 0).toFixed(4), time: tstr },
        { id: '5', name: 'QY', value: (d[4] ?? 0).toFixed(4), time: tstr },
        { id: '6', name: 'QZ', value: (d[5] ?? 0).toFixed(4), time: tstr },
        { id: '7', name: 'QW', value: (d[6] ?? 0).toFixed(4), time: tstr },
      ];
      return _slamData;
    }
  }, []);
  // GAIDONG: 核心数据获取逻辑
  // 1. 获取文件元数据 (总帧数)
  useEffect(() => {
    if (!hdf5File) return;

    const fetchMetadata = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(LOCAL_URL+`/api/v0/read/info?file=${encodeURIComponent(hdf5File)}`);
        const data = response.data;
        if (data && data.total_frames > 0) {
          setTotalFrames(data.total_frames);
          setCurrentFrame(0); // 设置总帧数后，自动请求第一帧
        } else {
          setError('无法获取文件信息或文件为空。');
        }
      } catch (err) {
        setError('加载文件元数据失败，请检查文件是否存在或后端服务是否正常。');
        console.error(err);
      }
      // setIsLoading(false); // 等待第一帧加载完再停止loading
    };

    fetchMetadata();
  }, [hdf5File]);

  // GAIDONG: 2. 根据 currentFrame 的变化，获取对应帧的数据
  useEffect(() => {
    if (!hdf5File || totalFrames === 0) return;

    const fetchFrameData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = `${LOCAL_URL}/api/v0/read/frame/${currentFrame}?file=${encodeURIComponent(hdf5File)}`;
        const response = await axios.get(url);
        setFrameData(response.data);
        // 如果返回的数据中有SLAM数据，则更新表格
        if (response.data?.slam_data) {
          setSlamData(formatPacket(response.data.slam_data));
        }

      } catch (err) {
        setError(`加载第 ${currentFrame} 帧数据失败。`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFrameData();
  }, [currentFrame, hdf5File, totalFrames, formatPacket]);

  // SEP1702: 自动播放的核心逻辑
  useEffect(() => {
    // 如果 isPlaying 是 false，或者总帧数为0，则清除定时器并返回
    if (!isPlaying || totalFrames === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 设置一个0.5秒的定时器来更新帧
    intervalRef.current = setInterval(() => {
      setCurrentFrame(prevFrame => {
        // 如果是最后一帧
        if (prevFrame >= totalFrames - 1) {
          setIsPlaying(false); // 停止播放
          if (intervalRef.current) {
            clearInterval(intervalRef.current); // 清除定时器
            intervalRef.current = null;
          }
          return prevFrame; // 保持在最后一帧
        }
        // 否则，前进到下一帧
        return prevFrame + 1;
      });
    }, 500); // 0.5秒

    // 清理函数：当 isPlaying 变为 false 或组件卸载时清除定时器
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, totalFrames]);



  // === 封装：数据流清理（SSE/轮询） === // ADD
  const cleanupStreams = () => {
    stopFlagRef.current = true;
    if (esRef.current) {
      try { esRef.current.close(); } catch { }
      esRef.current = null;
    }
    pollLoopRef.current = null;
    // setConnMode('idle');
    setConnOk(false);
  };

  // === 封装：视频流清理（MJPEG） === // ADD
  const cleanupMjpeg = () => {
    // DUQUHDF5_001：清除所有视频流
    const imgs = [mjpegRef.current, mjpegTofRef.current, mjpegHeadRgbRef.current, mjpegHeadTofRef.current, mjpegRightRgbRef.current, mjpegRightTofRef.current];
    imgs.forEach(img => {
      if (img) {
        img.onerror = null;
        img.src = '';
      }
    });

    if (mjpegObjectUrlRef.current) {
      try { URL.revokeObjectURL(mjpegObjectUrlRef.current); } catch { }
      mjpegObjectUrlRef.current = null;
    }
  };

  // 关键点 4: 使用 useEffect 훅建立与后端的连接，并处理数据接收。
  // 这是实现数据动态更新的核心。
  useEffect(() => {
    if (!connect) {           // 断开：立刻停源
      cleanupStreams();
      return;
    }

    stopFlagRef.current = false;
    // DUQUHDF5_001：根据是否存在HDF5文件来确定请求的URL

    // 【核心修改点】将实时数据流的URL从错误的 '/api/v0/data/stream' 修正为正确的 '/api/v0/data/sse'
    
    const dataStreamUrl = LOCAL_URL + '/api/v0/data/sse';

    // 优先使用 SSE
    let es: EventSource | null = null;
    try {
      es = new EventSource(dataStreamUrl);
      esRef.current = es;
      // setConnMode('sse');

      es.onopen = () => {
        if (stopFlagRef.current) return;
        setConnOk(true);
      };

      // 关键点 5: 监听 onmessage 事件。每当后端推送新数据时，此函数就会被触发。
      es.onmessage = (ev) => {
        if (stopFlagRef.current) return;
        try {
          const pkt = JSON.parse(ev.data); // 解析后端发来的JSON数据
          // 使用 `formatPacket` 函数处理数据
          const formattedData = formatPacket(pkt);
          // 调用 setSlamData 更新 state，这将触发UI的自动刷新
          setSlamData(formattedData);
        } catch (e) {
          // 忽略解析错误（可能是心跳）
        }
      };

      es.onerror = () => {
        // SSE 不通则关闭并回退到轮询
        try { es?.close(); } catch { }
        esRef.current = null;
        if (!stopFlagRef.current) startPolling();
      };
    } catch {
      startPolling();
    }

    function startPolling() {
      if (stopFlagRef.current) return;
      // setConnMode('poll');
      setConnOk(true);

      const loop = async () => {
        while (!stopFlagRef.current) {
          try {
            // 在轮询模式下，我们也可以调用 setSlamData 来更新数据
            const res: any = await getSlamData();
            const data = res?.data || res;
            if (data?.xyzData && data?.qData) {
              setSlamData([...data.xyzData, ...data.qData]);
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
  }, [connect, formatPacket, hdf5File]);

  // === 根据 connect 控制：挂载/取消 MJPEG 视频流 === // CHG
  useEffect(() => {
    if (!connect) {
      cleanupMjpeg();
      return;
    }

    // DUQUHDF5_001：根据是否存在HDF5文件来确定请求的URL
    const getMjpegUrl = (dataset: string) => {
      console.log("dataset=" + dataset);
      console.log("hdf5File=" + hdf5File);

      if (hdf5File) {
        // DUQUHDF5_001：这里需要确保数据集名称与您的HDF5文件中的完全匹配
        console.log("if (hdf5File)" + hdf5File);
        console.log(`/api/v0/read/video/mjpeg?file=${encodeURIComponent(hdf5File)}&dataset=${dataset}`);
        return `/api/v0/read/video/mjpeg?file=${encodeURIComponent(hdf5File)}&dataset=${dataset}`;

      } else {
        // DUQUHDF5_001：这里需要根据实际情况修改实时流的URL
        if (dataset === 'left_rgb') return `/test/api/v0/video/mjpeg?cb=${Date.now()}`;
        if (dataset === 'left_tof') return `/test/api/v0/video/tof/mjpeg?cb=${Date.now()}`;
        // 对于头戴和右手相机，这里需要填写对应的实时流URL
        return '';
      }
    };

    // DUQUHDF5_001：统一启动所有视频流。注意：这里的 'left_rgb' 等字符串需要与你HDF5文件中的数据集名称完全匹配
    if (mjpegRef.current) {
      mjpegRef.current.src = "http://localhost:8888" + getMjpegUrl('left_rgb');
    }
    if (mjpegTofRef.current) {
      mjpegTofRef.current.src = getMjpegUrl('left_tof');
    }
    if (mjpegHeadRgbRef.current) {
      mjpegHeadRgbRef.current.src = getMjpegUrl('head_rgb');
    }
    if (mjpegHeadTofRef.current) {
      mjpegHeadTofRef.current.src = getMjpegUrl('head_tof');
    }
    if (mjpegRightRgbRef.current) {
      mjpegRightRgbRef.current.src = getMjpegUrl('right_rgb');
    }
    if (mjpegRightTofRef.current) {
      mjpegRightTofRef.current.src = getMjpegUrl('right_tof');
    }


    // 清理（断开或卸载）
    return () => {
      cleanupMjpeg();
    };
  }, [connect, hdf5File]); // CHG: 依赖 connect 和 hdf5File

  const { basicGoods, basicProgress } = data || {
    basicGoods: [],
    basicProgress: [],
  };
  let goodsData: typeof basicGoods = [];

  if (basicGoods.length) {
    goodsData = basicGoods
  }

  // 关键点 6: 为统一的 SLAM 数据表格定义列结构。
  const slamColumns: ProColumns<SlamDataItem>[] = [
    {
      title: '参数',
      dataIndex: 'name',
      key: 'name',
      align: 'left',
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      align: 'left',
    },
  ];

  // 连接状态展示
  const connText = useMemo(() => {
    if (hdf5File) return '正在回放HDF5文件'; // DUQUHDF5_001：如果是回放模式，显示不同的状态
    if (!connect) return '未连接';
    if (!connOk) return '连接中…';
    // if (connMode === 'sse') return '已连接（SSE 实时）';
    // if (connMode === 'poll') return '已连接（长轮询）';
    return '已连接';
  }, [connect, connOk, hdf5File]); // CHG: 依赖 connect, connOk, connMode 和 hdf5File

  //当前时间
  const [nowStr, setNowStr] = useState<string>('');
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setNowStr(d.toLocaleTimeString());
    }, 1000);
    return () => clearInterval(t);
  }, []);


  // === 访问最近保存的 HDF5 ===
  const handleOpenH5 = () => {
    if (!lastFile) {
      message.info('暂无可访问的HDF5，请先停止采集生成文件');
      return;
    }
    const url = `/test/api/v0/record/download?file=${encodeURIComponent(lastFile)}`;
    window.open(url, '_blank');
  };

  // SEP1702: 新增按钮点击处理函数
  const handlePrevFrame = useCallback(() => {
    setCurrentFrame(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextFrame = useCallback(() => {
    setCurrentFrame(prev => Math.min(totalFrames > 0 ? totalFrames - 1 : 0, prev + 1));
  }, [totalFrames]);

  const handleTogglePlay = useCallback(() => {
    // 如果当前是最后一帧并且要开始播放，则从头开始
    if (currentFrame >= totalFrames - 1 && !isPlaying) {
      setCurrentFrame(0);
    }
    setIsPlaying(prev => !prev);
  }, [currentFrame, totalFrames, isPlaying]);

  // KEYBOARD_BINDING: 新增键盘事件处理逻辑
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 播放/暂停
    if (event.key === ' ') {
      event.preventDefault(); // 防止空格键导致页面滚动
      if (totalFrames === 0 || isLoading) return; // 检查是否禁用
      handleTogglePlay();
    }

    // 下一帧
    if (event.key === 'y') {
      if (isLoading || isPlaying || (totalFrames > 0 && currentFrame >= totalFrames - 1)) return; // 检查是否禁用
      handleNextFrame();
    }
  }, [isLoading, isPlaying, currentFrame, totalFrames, handleTogglePlay, handleNextFrame]);

  // KEYBOARD_BINDING: 使用 useEffect 在组件挂载时添加事件监听，卸载时移除
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <PageContainer>
      {/* ======= GAIDONG: 新增播放器控制区域 ======= */}
      {/* SEP1702: 在滑动条区域增加控制按钮 */}
      <Card style={{ marginBottom: 16 }}>
        <Row align="middle" gutter={16}>
          <Col>
            <Button onClick={handlePrevFrame} disabled={isLoading || isPlaying || currentFrame === 0}>
              &lt;
            </Button>
          </Col>
          <Col flex="auto">
            <Slider
              min={0}
              max={totalFrames > 0 ? totalFrames - 1 : 0}
              value={currentFrame}
              onChange={(value) => {
                if (isPlaying) setIsPlaying(false); // 拖动滑块时停止播放
                setCurrentFrame(value);
              }}
              disabled={totalFrames === 0 || isLoading || isPlaying}
              tooltip={{
                formatter: (value) => `帧: ${value}`
              }}
            />
          </Col>
          <Col>
            <Button onClick={handleNextFrame} disabled={isLoading || isPlaying || currentFrame >= totalFrames - 1}>
              &gt;
            </Button>
          </Col>
          <Col>
            <Button onClick={handleTogglePlay} disabled={totalFrames === 0 || isLoading}>
              {isPlaying ? '停止播放' : '自动播放'}
            </Button>
          </Col>
          <Col>
            <span style={{ color: '#666', minWidth: '80px', display: 'inline-block' }}>
              {`帧: ${currentFrame} / ${totalFrames > 0 ? totalFrames - 1 : 0}`}
            </span>
          </Col>
        </Row>
        {error && <Alert message={error} type="error" showIcon style={{ marginTop: 16 }} />}
      </Card>

      {/* ======= GAIDONG: 修改视频和数据展示区域，由 frameData 驱动 ======= */}
      <Spin spinning={isLoading} tip="加载数据中...">
        <Card variant="borderless" style={{ marginTop: 8 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)', // 保持3列布局
              gap: '16px',
            }}
          >
            {/* 左手 */}
            <Card type="inner" title="左手-RGB">
              <img
                src={frameData?.rgb_image || ''}
                alt="left-rgb"
                style={{ width: '100%', backgroundColor: 'black', minHeight: 240 }}
              />
            </Card>
            <Card type="inner" title="左手-TOF">
              <img
                src={frameData?.tof_image || ''}
                alt="left-tof"
                style={{ width: '100%', backgroundColor: 'black', minHeight: 240 }}
              />
            </Card>

            {/* SLAM 数据表格 */}
            <Card type="inner" title="SLAM 数据">
              <ProTable
                style={{ width: '100%' }}
                pagination={false}
                search={false}
                options={false}
                toolBarRender={false}
                dataSource={slamData}
                columns={slamColumns}
                rowKey="id"
              />
            </Card>

            {/* 其他视频流，您可以根据HDF5文件内容决定是否展示 */}
            {/*
            <Card type="inner" title="头戴-RGB">...</Card>
            <Card type="inner" title="头戴-TOF">...</Card>
            ...
            */}
          </div>
        </Card>
      </Spin>
    </PageContainer>

  );
};
export default SlamDataReview;