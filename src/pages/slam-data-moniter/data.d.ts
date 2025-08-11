export type XyzData = {
  id: string;
  name?: string;
  value?: string;
  time?: string;
  num?: string | number;
  amount?: string | number;
};

export type BasicGood = {
  id: string;
  name?: string;
  value?: string;
  time?: string;
  num?: string | number;
  amount?: string | number;
};

export type BasicProgress = {
  key: string;
  time: string;
  rate: string;
  status: string;
  operator: string;
  cost: string;
};

export type SlamDatas = {
  data: object
}