import type { Request, Response } from 'express';

const basicGoods = [
  {
    id: '1',
    name: '坐标X',
    barcode: '坐标X',
    price: '2.00',
    num: '1',
    amount: '0.075',
    time: '2017-10-01 14:10',
  },
  {
    id: '2',
    name: '坐标Y',
    barcode: '坐标Y',
    price: '-0.300',
    num: '2',
    amount: '6.00',
    time: '2017-10-01 14:05',
  },
  {
    id: '3',
    name: '坐标Z',
    barcode: '坐标Z',
    price: '7.00',
    num: '4',
    amount: '-0.01',
    time: '2017-10-01 13:05',
  },
  // {
  //   id: '1234564',
  //   name: '特别好吃的蛋卷',
  //   barcode: '12421432143214324',
  //   price: '8.50',
  //   num: '3',
  //   amount: '25.50',
  // },
];

const basicProgress = [
  {
    key: '1',
    time: '2017-10-01 14:10',
    rate: 'QX',
    status: 'processing',
    operator: '取货员 ID1234',
    cost: '-0.163',
  },
  {
    key: '2',
    time: '2017-10-01 14:05',
    rate: 'QY',
    status: 'success',
    operator: '取货员 ID1234',
    cost: '0.145',
  },
  {
    key: '3',
    time: '2017-10-01 13:05',
    rate: 'QZ',
    status: 'success',
    operator: '取货员 ID1234',
    cost: '-0.172',
  },
  {
    key: '4',
    time: '2017-10-01 13:00',
    rate: 'QW',
    status: 'success',
    operator: '系统',
    cost: '0.348',
  },
];

function getProfileBasic(_: Request, res: Response) {
  return res.json({
    data: {
      basicProgress,
      basicGoods,
    },
  });
}

export default {
  'GET  /api/profile/basic': getProfileBasic,
};
