/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
export default {
  // 如果需要自定义本地开发服务器  请取消注释按需调整
  test_dev: {
    // localhost:8000/api/** -> https://preview.pro.ant.design/api/**
    // '/api/': {
    //   // 要代理的地址
    //   target: 'http://localhost:8888',
    //   // 配置了这个可以从 http 代理到 https
    //   // 依赖 origin 的功能可能需要这个，比如 cookie
    //   changeOrigin: true,
    //   // pathRewrite: { '^/api': '' }, // 去掉 /api 前缀
    // },
    // 走 REST 接口
    '/test/': {
      target: 'http://127.0.0.1:8888/api/',
      changeOrigin: true,
      // 后端没有 /api 前缀就去掉
      pathRewrite: { '^/test/api': '' },
    },
    // 走 WebSocket（如果需要）
    '/ws': {
      target: 'ws://127.0.0.1:8000',
      ws: true,
      changeOrigin: true,
      // 由于代理，前端始终连 ws://127.0.0.1:8001/ws/echo
        // const ws = new WebSocket('ws://127.0.0.1:8001/ws/echo');
        // ws.onopen = () => ws.send('hello');
        // ws.onmessage = (e) => console.log('recv:', e.data);
    },
  },
  dev: {
    // localhost:8000/api/** -> https://preview.pro.ant.design/api/**
    // '/api/': {
    //   // 要代理的地址
    //   target: 'http://localhost:8888',
    //   // 配置了这个可以从 http 代理到 https
    //   // 依赖 origin 的功能可能需要这个，比如 cookie
    //   changeOrigin: true,
    //   // pathRewrite: { '^/api': '' }, // 去掉 /api 前缀
    // },
    // 走 REST 接口
    '/api/': {
      target: 'http://127.0.0.1:8888/api/',
      changeOrigin: true,
      // 后端没有 /api 前缀就去掉
      pathRewrite: { '^/api': '' },
    },
    // 走 WebSocket（如果需要）
    '/ws': {
      target: 'ws://127.0.0.1:8000',
      ws: true,
      changeOrigin: true,
      // 由于代理，前端始终连 ws://127.0.0.1:8001/ws/echo
        // const ws = new WebSocket('ws://127.0.0.1:8001/ws/echo');
        // ws.onopen = () => ws.send('hello');
        // ws.onmessage = (e) => console.log('recv:', e.data);
    },
  },
  /**
   * @name 详细的代理配置
   * @doc https://github.com/chimurai/http-proxy-middleware
   */
  test: {
    // localhost:8000/api/** -> https://preview.pro.ant.design/api/**
    '/api/': {
      target: 'https://proapi.azurewebsites.net',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  pre: {
    '/api/': {
      target: 'your pre url',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
};
