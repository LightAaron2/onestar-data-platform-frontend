import type {
  ActionType,
  ProColumns,
  ProDescriptionsItemProps,
} from '@ant-design/pro-components';
import {
  FooterToolbar,
  PageContainer,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useRequest } from '@umijs/max';
import { Card, Col, Row, Button, Drawer, Input, message, Collapse } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { removeRule, rule } from '@/services/testapi/api';
import useStyles from './style.style';
import { PushpinOutlined, CaretRightOutlined } from '@ant-design/icons';

const Guide: React.FC = () => {
  const { styles } = useStyles();
  const actionRef = useRef<ActionType | null>(null);

  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<API.HDF5ListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.RuleListItem[]>([]);
  const [hdf5Data, setHdf5Data] = useState<API.HDF5ListItem[]>([]);

  /**
   * @en-US International configuration
   * @zh-CN 国际化配置
   * */
  const intl = useIntl();

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    // fetch(`${'http://localhost:8888'}/api/v0/files`)
    //   .then(r => r.json())
    //   .then((list) => {
    //     list.forEach((element: { callNo: string; status: number; }) => {
    //       element.callNo =  (Math.floor(Math.random() * 90) + 10).toString();// 示例：你可以根据逻辑生成具体的数值
    //       element.status = 2;
    //     });
    //     setHdf5Data(list);
    //   })
    //   .catch(console.error);
  }, []);
  const content = (
    <div className={styles.pageHeaderContent}>
      <p>
        步骤视频将会分块展示每一步操作的规范操作，请采集员员在开始采集前认真浏览。
        规范标注标准，提高效率与准确性。
      </p>
      <div className={styles.contentLink}>
        <a>
          <img
            alt=""
            src="https://gw.alipayobjects.com/zos/rmsportal/NbuDUAuBlIApFuDvWiND.svg"
          />{' '}
          简介
        </a>
        <a>
          <img
            alt=""
            src="https://gw.alipayobjects.com/zos/rmsportal/ohOEPSYdDTNnyMbGuyLb.svg"
          />{' '}
          功能文档
        </a>
      </div>
    </div>
  );

  const items = [
    {
      key: '1',
      label: '设备调试',
      children:  <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}> 
        <Col span={8}>
          <Card
            hoverable
            className={styles.videoCard} 
            actions={[
              <video  controls playsInline className={styles.videoPlayer}><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle} > <PushpinOutlined /> 步骤 A</div></Card>
        </Col>

        <Col span={8}>
          <Card
            className={styles.videoCard} 
            hoverable
            actions={[
              <video  controls playsInline className={styles.videoPlayer} ><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle}> <PushpinOutlined /> 步骤 B</div></Card>
        </Col>

        <Col span={8}>
          <Card
            className={styles.videoCard} 
            hoverable
            actions={[
              <video  controls playsInline className={styles.videoPlayer} ><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle}> <PushpinOutlined /> 步骤 C</div></Card>
        </Col>
      </Row>,
    },
    {
      key: '2',
      label: '采集数据元',
      children:  <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}> 
        <Col span={8}>
          <Card
            hoverable
            className={styles.videoCard} 
            actions={[
              <video  controls playsInline className={styles.videoPlayer}><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle} > <PushpinOutlined /> 步骤 A</div></Card>
        </Col>

        <Col span={8}>
          <Card
            className={styles.videoCard} 
            hoverable
            actions={[
              <video  controls playsInline className={styles.videoPlayer} ><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle}> <PushpinOutlined /> 步骤 B</div></Card>
        </Col>

        <Col span={8}>
          <Card
            className={styles.videoCard} 
            hoverable
            actions={[
              <video  controls playsInline className={styles.videoPlayer} ><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle}> <PushpinOutlined /> 步骤 C</div></Card>
        </Col>
      </Row>,
    },
    {
      key: '3',
      label: '测试数据元',
      children:  <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}> 
        <Col span={8}>
          <Card
            hoverable
            className={styles.videoCard} 
            actions={[
              <video  controls playsInline className={styles.videoPlayer}><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle} > <PushpinOutlined /> 步骤 A</div></Card>
        </Col>

        <Col span={8}>
          <Card
            className={styles.videoCard} 
            hoverable
            actions={[
              <video  controls playsInline className={styles.videoPlayer} ><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle}> <PushpinOutlined /> 步骤 B</div></Card>
        </Col>

        <Col span={8}>
          <Card
            className={styles.videoCard} 
            hoverable
            actions={[
              <video  controls playsInline className={styles.videoPlayer} ><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle}> <PushpinOutlined /> 步骤 C</div></Card>
        </Col>
      </Row>,
    },
    {
      key: '4',
      label: '分发数据元',
      children:  <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}> 
        <Col span={8}>
          <Card
            hoverable
            className={styles.videoCard} 
            actions={[
              <video  controls playsInline className={styles.videoPlayer}><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle} > <PushpinOutlined /> 步骤 A</div></Card>
        </Col>

        <Col span={8}>
          <Card
            className={styles.videoCard} 
            hoverable
            actions={[
              <video  controls playsInline className={styles.videoPlayer} ><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle}> <PushpinOutlined /> 步骤 B</div></Card>
        </Col>

        <Col span={8}>
          <Card
            className={styles.videoCard} 
            hoverable
            actions={[
              <video  controls playsInline className={styles.videoPlayer} ><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle}> <PushpinOutlined /> 步骤 C</div></Card>
        </Col>
      </Row>,
    },
    {
      key: '4',
      label: '保存数据元',
      children:  <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}> 
        <Col span={8}>
          <Card
            hoverable
            className={styles.videoCard} 
            actions={[
              <video  controls playsInline className={styles.videoPlayer}><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle} > <PushpinOutlined /> 步骤 A</div></Card>
        </Col>

        <Col span={8}>
          <Card
            className={styles.videoCard} 
            hoverable
            actions={[
              <video  controls playsInline className={styles.videoPlayer} ><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle}> <PushpinOutlined /> 步骤 B</div></Card>
        </Col>

        <Col span={8}>
          <Card
            className={styles.videoCard} 
            hoverable
            actions={[
              <video  controls playsInline className={styles.videoPlayer} ><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle}> <PushpinOutlined /> 步骤 C</div></Card>
        </Col>
      </Row>,
    },
  ];
  return (
    <PageContainer content={content} title={"任务视教视频"}>
      {contextHolder}
      {/* <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}> 
        <Col span={8}>
          <Card
            hoverable
            className={styles.videoCard} 
            actions={[
              <video  controls playsInline className={styles.videoPlayer}><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle} > <PushpinOutlined /> 步骤 A</div></Card>
        </Col>

        <Col span={8}>
          <Card
            className={styles.videoCard} 
            hoverable
            actions={[
              <video  controls playsInline className={styles.videoPlayer} ><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle}> <PushpinOutlined /> 步骤 B</div></Card>
        </Col>

        <Col span={8}>
          <Card
            className={styles.videoCard} 
            hoverable
            actions={[
              <video  controls playsInline className={styles.videoPlayer} ><source src="http:/123.mp4" type="video/mp4" /></video>
            ]}
          ><div className={styles.videoTitle}> <PushpinOutlined /> 步骤 C</div></Card>
        </Col>
      </Row> */}
      <Collapse bordered={false} expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />} items={items} size="large" defaultActiveKey={['1']}  />
    </PageContainer>
  );
};

export default Guide;
