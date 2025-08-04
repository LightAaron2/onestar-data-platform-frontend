import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Card, theme } from 'antd';
import React from 'react';
import { GridContent } from '@ant-design/pro-components';
import IntroduceRow from './dashboard/components/IntroduceRow';
import dayjs from 'dayjs';
/**
 * 每个单独的卡片，为了复用样式抽成了组件
 * @param param0
 * @returns
 */
const InfoCard: React.FC<{
  title: string;
  index: number;
  desc: string;
  href: string;
}> = ({ title, href, index, desc }) => {
  const { useToken } = theme;

  const { token } = useToken();

  return (
    <div
      style={{
        backgroundColor: token.colorBgContainer,
        boxShadow: token.boxShadow,
        borderRadius: '8px',
        fontSize: '14px',
        color: token.colorTextSecondary,
        lineHeight: '22px',
        padding: '16px 19px',
        minWidth: '220px',
        flex: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            lineHeight: '22px',
            backgroundSize: '100%',
            textAlign: 'center',
            padding: '8px 16px 16px 12px',
            color: '#FFF',
            fontWeight: 'bold',
            backgroundImage:
              "url('https://gw.alipayobjects.com/zos/bmw-prod/daaf8d50-8e6d-4251-905d-676a24ddfa12.svg')",
          }}
        >
          {index}
        </div>
        <div
          style={{
            fontSize: '16px',
            color: token.colorText,
            paddingBottom: 8,
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          fontSize: '14px',
          color: token.colorTextSecondary,
          textAlign: 'justify',
          lineHeight: '22px',
          marginBottom: 8,
        }}
      >
        {desc}
      </div>
      <a href={href} target="_blank" rel="noreferrer">
        了解更多 {'>'}
      </a>
    </div>
  );
};
export interface DataItem {
  [field: string]: string | number | number[] | null | undefined;
}
const visitData: DataItem[] = [];
const beginDay = Date.now();
const fakeY = [7, 5, 4, 2, 4, 7, 5, 6, 5, 9, 6, 3, 1, 5, 3, 6, 5];
for (let i = 0; i < fakeY.length; i += 1) {
  visitData.push({
    x: dayjs(new Date(beginDay + 1000 * 60 * 60 * 24 * i)).format('YYYY-MM-DD'),
    y: fakeY[i],
  });
}

const Welcome: React.FC = () => {
  const { token } = theme.useToken();
  const { initialState } = useModel('@@initialState');
  return (
    <PageContainer>
      <GridContent>
        <IntroduceRow loading={false} visitData={visitData || []} />
      </GridContent>
      <Card
        style={{
          borderRadius: 8,
        }}
        styles={{
          body: {
            backgroundImage:
              initialState?.settings?.navTheme === 'realDark'
                ? 'background-image: linear-gradient(75deg, #1A1B1F 0%, #191C1F 100%)'
                : 'background-image: linear-gradient(75deg, #FBFDFF 0%, #F5F7FF 100%)',
          },
        }}
      >
        <div
          style={{
            backgroundPosition: '100% -30%',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '274px auto',
            // backgroundImage:
            //   "url('https://gw.alipayobjects.com/mdn/rms_a9745b/afts/img/A*BuFmQqsB2iAAAAAAAAAAAAAAARQnAQ')",
          }}
        >
          <div
            style={{
              fontSize: '20px',
              color: token.colorTextHeading,
            }}
          >
            欢迎使用One Star 数据开放平台
          </div>
          <p
            style={{
              fontSize: '14px',
              color: token.colorTextSecondary,
              lineHeight: '22px',
              marginTop: 16,
              marginBottom: 32,
              width: '65%',
            }}
          >
            One Star 数据开放平台是一款专为具身智能领域打造的数据采集、管理与标注系统，致力于为VLA模型训练提供高质量、可扩展的数据服务能力。
            平台采用存储与业务分离架构，数据可灵活存储于公有云或私有云对象存储。在本地私有云部署环境下，平台已稳定支撑超过300TB数据的标注、导入与导出，充分验证了架构的高可扩展性与可靠性。
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <InfoCard
              index={1}
              href="#"
              title="Know-How 积累"
              desc="我们拥有丰富的数据采集与模型训练经验，累计处理并标注了上千小时的多模态数据。团队持续将实践中的Know-How沉淀为平台标准功能，助力客户高效实现数据闭环。"
            />
            <InfoCard
              index={2}
              title="无缝集成One Star产品"
              href="#"
              desc="One Star数据平台已与One Star数据采集及遥操作产品深度集成，实现数据流转无缝衔接。"
            />
            <InfoCard
              index={3}
              title="数据安全保障"
              href="#"
              desc="我们深知客户对数据安全与合规的重视，平台支持多重安全机制，包括私有化离线部署、IP白名单、访问与操作日志等，全方位保障您的数据安全与合规。"
            />
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};

export default Welcome;
