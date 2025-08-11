// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 发送验证码 POST /api/login/captcha */
export async function getFakeCaptcha(
  params: {
    // query
    /** 手机号 */
    phone?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.FakeCaptcha>('/api/login/captcha', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}


export async function ping() {
  // 实际会走 http://127.0.0.1:8000/test/api/v0/ping -> 代理到 http://127.0.0.1:8888/api/v0/ping
  return request<{ msg: string }>('/test/api/v0/ping', {
    method: 'GET',
    // 如果后端用 Cookie 鉴权：
    // credentials: 'include',
  });
}