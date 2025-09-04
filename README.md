#  OneStar智能数据标注系统
## 前端项目

### - 安装依赖
`npm install`

### - 运行demo
`npm run start` --  前端开发测试环境
`npm run start:dev-test` -- 前后端连通测试环境
`git commit -m "update func" --no-verify`

conda activate Test
cd data-open-platform-backend
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8888

### - 界面效果
<img width="2070" height="1188" alt="Screen Shot 2025-07-27 at 5 45 05 PM" src="https://github.com/user-attachments/assets/ce9eca2d-c251-45ec-b092-5f3df176e80c" />



#任务视教视频。搜索（以任务序号搜索，关键字？？），列表，任务介绍，动作序列（第一步第二步等等）（和标注有关），建议时长，注意事项
强制学习视频才能进入对应任务（先不做）

SLAM页面标题改称：FastUMI数据采集

任务信息：任务选项   （就是视教视频中的任务列表）
连接设备按钮 连接状态：（连接/断开） 先连接，再检测（总的：正常/异常） 激光传感器状态（正常/异常） 视觉里程计状态（正常/异常） 视频流状态（正常/异常） 深度传感器状态（正常/异常）
采集进度条（双手拿起来，采集，放下 和扎西）
采集的时候再去监控键盘按键

HDF5采集列表页面标题改称：数据存储列表

HDF5数据读取页面标题改称：数据可视化