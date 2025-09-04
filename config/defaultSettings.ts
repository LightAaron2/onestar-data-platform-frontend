import type { ProLayoutProps } from '@ant-design/pro-components';

/**
 * @name
 */
const css = `
  /* 放大公司logo */
  .ant-pro-global-header-logo img {
    height: 48px !important; /* 改大一些 */
    vertical-align: middle;        /* 保证和文字垂直居中 */
  }
  /* 放大标题文字 */
  .ant-pro-global-header-logo h1 {
    font-size: 22px !important; /* 默认约16px */
    font-weight: bold;          /* 加粗让它更显眼 */
    display: inline-block;
    vertical-align: middle;     /* 保证和图标垂直对齐 */
  }
}
`;
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = css;
  document.head.appendChild(styleTag);
}
const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
} = {
  navTheme: 'light',
  // 拂晓蓝
  colorPrimary: '#1890ff',
  layout: 'mix',
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixSiderbar: true,
  colorWeak: false,
  title: '智能采训系统',
  pwa: true,
  logo: './logo-rmbg.png',
  iconfontUrl: '',
  token: {
    // 参见ts声明，demo 见文档，通过token 修改样式
    //https://procomponents.ant.design/components/layout#%E9%80%9A%E8%BF%87-token-%E4%BF%AE%E6%94%B9%E6%A0%B7%E5%BC%8F
  },
};

export default Settings;
