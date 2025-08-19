import { request } from '@umijs/max';
import type { BasicGood, BasicProgress, XyzData, Qdata } from './data.d';

export async function queryBasicProfile(): Promise<{
  data: {
    basicProgress: BasicProgress[];
    basicGoods: BasicGood[];
  };
}> {
  return request('/api/profile/basic');
}

export async function connectBackend(): Promise<{}> {
  return request('/api/v1/status')
}

export async function getSlamData(): Promise<{
  data: {
    xyzData: XyzData[];
    qData: Qdata[];
  }
}> {
  return request('/test/api/v0/data', {
    method: 'GET',
  });
}