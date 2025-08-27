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

/** HDF5 列表（供采集页 ProTable 使用） */
// CHG: 将原本重复命名的 rule 改名为 hdf5Rule，避免与上面的 rule 冲突
export async function hdf5Rule(params: { // CHG
  current?: number;
  pageSize?: number;
  keyword?: string;
}) {
  const res = await request<{
    data: API.RuleListItem[];
    total: number;
    success: boolean;
  }>('http://127.0.0.1:8000/api/v0/hdf5/list', {
    method: 'GET',
    params: {
      current: params?.current ?? 1,
      pageSize: params?.pageSize ?? 10,
      keyword: params?.keyword ?? '',
    },
  });
  return res;
}

/** 生成 HDF5 下载链接 */
export function h5DownloadUrl(name: string) { // ADD
  const q = encodeURIComponent(name);
  return `http://127.0.0.1:8000/api/v0/hdf5/download?name=${q}`;
}
