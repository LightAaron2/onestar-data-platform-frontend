import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Badge, Card, Descriptions, Divider, Row, Col, Button } from 'antd';
import type { FC } from 'react';
import React from 'react';
import type { BasicGood, BasicProgress } from './data.d';
import { queryBasicProfile } from './service';
import useStyles from './style.style';

const progressColumns: ProColumns<BasicProgress>[] = [
  {
    title: '时间',
    dataIndex: 'time',
    key: 'time',
    align: 'left'
  },
  {
    title: '姿态四元数',
    dataIndex: 'rate',
    key: 'rate',
    align: 'left'
  },
  // {
  //   title: '状态',
  //   dataIndex: 'status',
  //   key: 'status',
  //   render: (text: React.ReactNode) => {
  //     if (text === 'success') {
  //       return <Badge status="success" text="成功" />;
  //     }
  //     return <Badge status="processing" text="进行中" />;
  //   },
  // },
  // {
  //   title: '操作员ID',
  //   dataIndex: 'operator',
  //   key: 'operator',
  // },
  {
    title: '数值',
    dataIndex: 'cost',
    key: 'cost',
    align: 'left'
  },
];

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
  const { styles } = useStyles();
  const { data, loading } = useRequest(() => {
    return queryBasicProfile();
  });
  const { basicGoods, basicProgress } = data || {
    basicGoods: [],
    basicProgress: [],
  };
  let goodsData: typeof basicGoods = [];
  if (basicGoods.length) {
    let num = 0;
    let amount = 0;
    basicGoods.forEach((item) => {
      num += Number(item.num);
      amount += Number(item.amount);
    });
    // goodsData = basicGoods.concat({
    //   id: '总计',
    //   num,
    //   amount,
    // });
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
  const goodsColumns: ProColumns<BasicGood>[] = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      align: 'left'
    },
    {
      title: '位置坐标',
      dataIndex: 'name',
      key: 'name',
      align: 'left'
    },
    // {
    //   title: '商品名称',
    //   dataIndex: 'name',
    //   key: 'name',
    //   render: renderContent,
    // },
    // {
    //   title: '商品条码',
    //   dataIndex: 'barcode',
    //   key: 'barcode',
    //   render: renderContent,
    // },
    {
      title: '数值',
      dataIndex: 'price',
      key: 'price',
      align: 'left' as 'left' | 'right' | 'center',
      render: renderContent,
    },
    // {
    //   title: '数量（件）',
    //   dataIndex: 'num',
    //   key: 'num',
    //   align: 'right' as 'left' | 'right' | 'center',
    //   render: (text: React.ReactNode, _: any, index: number) => {
    //     if (index < basicGoods.length) {
    //       return text;
    //     }
    //     return (
    //       <span
    //         style={{
    //           fontWeight: 600,
    //         }}
    //       >
    //         {text}
    //       </span>
    //     );
    //   },
    // },
    // {
    //   title: '金额',
    //   dataIndex: 'amount',
    //   key: 'amount',
    //   align: 'right' as 'left' | 'right' | 'center',
    //   render: (text: React.ReactNode, _: any, index: number) => {
    //     if (index < basicGoods.length) {
    //       return text;
    //     }
    //     return (
    //       <span
    //         style={{
    //           fontWeight: 600,
    //         }}
    //       >
    //         {text}
    //       </span>
    //     );
    //   },
    // },
  ];
  return (
    <PageContainer>
      {/* <div className={styles.standardList}> */}
      <Card>
        <Row>
          <Col sm={8} xs={24}>
            <Info title="连接状态" value="未连接" bordered />
          </Col>
          <Col sm={8} xs={24}>
            <Info title="机器人编号" value="0001" bordered />
          </Col>
          <Col sm={8} xs={24}>
            <Info title="当前时间" value="7:45:01 PM" />
          </Col>
        </Row>
      </Card>
      <Card
      style={{
        marginTop: 24,
      }}    
      >
        <Row>
          <Col sm={8} xs={24} style={{textAlign: 'center'}}>
            <Button type="primary" size="large" style={{width: 180}}>开始采集</Button>
          </Col>
          <Col sm={8} xs={24} style={{textAlign: 'center'}}>
            <Button size="large" danger style={{width: 180}}>停止采集</Button>
          </Col>
          <Col sm={8} xs={24} style={{textAlign: 'center'}}>
            <Button type="dashed" size="large" style={{width: 180}}>访问HDF5文件</Button>
          </Col>
        </Row>
      </Card>
      <Card variant="borderless"
      style={{
        marginTop: 24,
      }}      
      >
        <Descriptions
          title="视频流"
          style={{
            marginBottom: 32,
          }}
        >
          <div id="video-container">
              <div style={{width: "100%", height: 600, backgroundColor: 'black', color: 'white'}} id="video-placeholder">
                  <span style={{marginLeft:5,fontSize:15}}>等待视频流连接...</span>
              </div>
          </div>
        </Descriptions>
        <Descriptions
          style={{
            marginBottom: 32,
          }}
          column={4}
        >
          <Descriptions.Item label="操作按键："><Button  size="large">刷新视频</Button></Descriptions.Item>
          <Descriptions.Item label="操作按键："><Button  size="large">检查状态</Button></Descriptions.Item>
          <Descriptions.Item label="操作按键："><Button  size="large">全屏模式</Button></Descriptions.Item>
          <Descriptions.Item label="操作按键："><Button  size="large">重置SLAM</Button></Descriptions.Item>
        </Descriptions>
        <Divider
          style={{
            marginBottom: 32,
          }}
        />
        {/* <Descriptions
          title="用户信息"
          style={{
            marginBottom: 32,
          }}
        >
          <Descriptions.Item label="用户姓名">付小小</Descriptions.Item>
          <Descriptions.Item label="联系电话">18100000000</Descriptions.Item>
          <Descriptions.Item label="常用快递">菜鸟仓储</Descriptions.Item>
          <Descriptions.Item label="取货地址">
            浙江省杭州市西湖区万塘路18号
          </Descriptions.Item>
          <Descriptions.Item label="备注">无</Descriptions.Item>
        </Descriptions> */}
        <Divider
          style={{
            marginBottom: 32,
          }}
        />
        <div className={styles.title}>SLAM 数据</div>
        <ProTable
          style={{
            marginBottom: 24,
          }}
          pagination={false}
          search={false}
          loading={loading}
          options={false}
          toolBarRender={false}
          dataSource={goodsData}
          columns={goodsColumns}
          rowKey="id"
        />
        {/* <div className={styles.title}>姿态四元数</div> */}
        <ProTable
          style={{
            marginBottom: 16,
          }}
          pagination={false}
          loading={loading}
          search={false}
          options={false}
          toolBarRender={false}
          dataSource={basicProgress}
          columns={progressColumns}
        />
        
      </Card>
    {/* </div> */}
    </PageContainer>
  );
};
export default SlamDataMoniter;
