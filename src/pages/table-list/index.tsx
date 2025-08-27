import type {
  ActionType,
  ProColumns,
  ProDescriptionsItemProps,
} from '@ant-design/pro-components';
import {
  FooterToolbar,
  PageContainer,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useRequest } from '@umijs/max';
import { Button, Drawer, Input, message, Descriptions } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { removeRule, rule } from '@/services/testapi/api';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<API.HDF5ListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.RuleListItem[]>([]);
  const [hdf5Data, setHdf5Data] = useState<API.HDF5ListItem[]>([]);

  /**
   * @en-US International configuration
   * @zh-CN 国际化配置
   * */
  const intl = useIntl();

  const [messageApi, contextHolder] = message.useMessage();

  const { run: delRun, loading } = useRequest(removeRule, {
    manual: true,
    onSuccess: () => {
      setSelectedRows([]);
      actionRef.current?.reloadAndRest?.();

      messageApi.success('Deleted successfully and will refresh soon');
    },
    onError: () => {
      messageApi.error('Delete failed, please try again');
    },
  });

  const columns: ProColumns<API.HDF5ListItem>[] = [
    {
      title: 'ID',
      dataIndex: 'index',
      hideInSearch:false,

    },
    {
      title: '文件名称',
      dataIndex: 'name',
      hideInSearch:false,
      render: (dom, entity) => {
        return (
          <a
            onClick={() => {
              setCurrentRow(entity);
              // setShowDetail(true);
            }}
          >
            {dom}
          </a>
        );
      },
    },
    // {
    //   title: (
    //     <FormattedMessage
    //       id="pages.searchTable.titleDesc"
    //       defaultMessage="Description"
    //     />
    //   ),
    //   dataIndex: 'desc',
    //   valueType: 'textarea',
    //   hideInSearch: true,
    // },
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.titleCallNo"
          defaultMessage="Number of service calls"
        />
      ),
      dataIndex: 'callNo',
      // sorter: true,
      hideInSearch: true,
      renderText: (val: string) =>
        `${val}次`,
    },
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.titleStatus"
          defaultMessage="Status"
        />
      ),
      dataIndex: 'status',
      // hideInSearch: true,
      valueEnum: {
        2: {
          text: (
            <FormattedMessage
              id="pages.searchTable.nameStatus.online"
              defaultMessage="Online"
            />
          ),
          status: 'Success',
        },
        3: {
          text: (
            <FormattedMessage
              id="pages.searchTable.nameStatus.abnormal"
              defaultMessage="Abnormal"
            />
          ),
          status: 'Error',
        },
      },
    },
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.titleUpdatedAt"
          defaultMessage="Last scheduled time"
        />
      ),
      sorter: true,
      hideInSearch: true,
      dataIndex: 'date',
      valueType: 'dateTime',
      renderFormItem: (item, { defaultRender, ...rest }, form) => {
        const status = form.getFieldValue('status');
        if (`${status}` === '0') {
          return false;
        }
        if (`${status}` === '3') {
          return (
            <Input
              {...rest}
              placeholder={intl.formatMessage({
                id: 'pages.searchTable.exception',
                defaultMessage: 'Please enter the reason for the exception!',
              })}
            />
          );
        }
        return defaultRender(item);
      },
    },
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.titleOption"
          defaultMessage="Operating"
        />
      ),
      dataIndex: 'option',
      valueType: 'option',
      render: (_, entity) => [
        // <UpdateForm
        //   trigger={
        //     <a>
        //       <FormattedMessage
        //         id="pages.searchTable.config"
        //         defaultMessage="Configuration"
        //       />
        //     </a>
        //   }
        //   key="config"
        //   onOk={actionRef.current?.reload}
        //   values={record}
        // />,
        <a
        onClick={() => {
          setCurrentRow(entity);
          setShowDetail(true);
        }}
        >
        <FormattedMessage
          id="pages.searchTable.config"
          defaultMessage="Config"
        />
        </a>,
        <a key="viewdetail" href="/slam-data-moniter">
          {/* <FormattedMessage
            id="pages.searchTable.viewdetail"
            defaultMessage="View detail"
          /> */}
          读取视频文件
        </a>,
      ],
    },
  ];

  const columns_drawer: ProColumns<API.HDF5ListItem>[] = [
    {
      // title: (
      //   <FormattedMessage
      //     id="pages.searchTable.updateForm.ruleName.nameLabel"
      //     defaultMessage="Rule name"
      //   />
      // ),
      title: 'ID',
      dataIndex: 'index',
      hideInSearch: true,
      // render: (dom, entity) => {
      //   return (
      //     <a
      //       onClick={() => {
      //         setCurrentRow(entity);
      //         // setShowDetail(true);
      //       }}
      //     >
      //       {dom}
      //     </a>
      //   );
      // },
    },
    {
      title: '文件名称',
      dataIndex: 'name',
      hideInSearch: true,
      render: (dom, entity) => {
        return (
          <a
            onClick={() => {
              setCurrentRow(entity);
              // setShowDetail(true);
            }}
          >
            {dom}
          </a>
        );
      },
    },
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.titleCallNo"
          defaultMessage="Number of service calls"
        />
      ),
      dataIndex: 'callNo',
      // sorter: true,
      hideInSearch: true,
      renderText: (val: string) =>
        `${val}${intl.formatMessage({
          id: 'pages.searchTable.tenThousand',
          defaultMessage: ' 次 ',
        })}`,
    },
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.titleStatus"
          defaultMessage="Status"
        />
      ),
      dataIndex: 'status',
      hideInSearch: true,
      valueEnum: {
        0: {
          text: (
            <FormattedMessage
              id="pages.searchTable.nameStatus.default"
              defaultMessage="Shut down"
            />
          ),
          status: 'Default',
        },
        1: {
          text: (
            <FormattedMessage
              id="pages.searchTable.nameStatus.running"
              defaultMessage="Running"
            />
          ),
          status: 'Processing',
        },
        2: {
          text: (
            <FormattedMessage
              id="pages.searchTable.nameStatus.online"
              defaultMessage="Online"
            />
          ),
          status: 'Success',
        },
        3: {
          text: (
            <FormattedMessage
              id="pages.searchTable.nameStatus.abnormal"
              defaultMessage="Abnormal"
            />
          ),
          status: 'Error',
        },
      },
    },
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.titleUpdatedAt"
          defaultMessage="Last scheduled time"
        />
      ),
      sorter: true,
      hideInSearch: true,
      dataIndex: 'date',
      valueType: 'dateTime',
      renderFormItem: (item, { defaultRender, ...rest }, form) => {
        const status = form.getFieldValue('status');
        if (`${status}` === '0') {
          return false;
        }
        if (`${status}` === '3') {
          return (
            <Input
              {...rest}
              placeholder={intl.formatMessage({
                id: 'pages.searchTable.exception',
                defaultMessage: 'Please enter the reason for the exception!',
              })}
            />
          );
        }
        return defaultRender(item);
      },
    },
  ];

  const handleRemove = useCallback(
    async (selectedRows: API.RuleListItem[]) => {
      if (!selectedRows?.length) {
        messageApi.warning('请选择删除项');

        return;
      }

      await delRun({
        data: {
          key: selectedRows.map((row) => row.key),
        },
      });
    },
    [delRun, messageApi.warning],
  );

  const { data: hdf5Datas, loading: xyzdataloding } = useRequest (async () => {
    console.log('请求....HDF5')
    return await rule();
   
  });
  // useEffect(() => {
  //   console.log(hdf5Datas)
  //   if (hdf5Datas !== undefined) {
  //     setHdf5Data(hdf5Datas)
  //   } 
  // }, [hdf5Datas])


  useEffect(() => {
    fetch(`${'http://localhost:8888'}/api/v0/files`)
      .then(r => r.json())
      .then((list) => {
        list.forEach((element: { callNo: string; status: number; }) => {
          element.callNo =  (Math.floor(Math.random() * 90) + 10).toString();// 示例：你可以根据逻辑生成具体的数值
          element.status = 2;
        });
        setHdf5Data(list);
      })
      .catch(console.error);
  }, []);


  return (
    <PageContainer>
      {contextHolder}
      <ProTable<API.HDF5ListItem, API.PageParams>
        headerTitle={intl.formatMessage({
          id: 'pages.searchTable.title',
          defaultMessage: 'Enquiry form',
        })}
        actionRef={actionRef}
        rowKey="index"
        search={{
          labelWidth: 120,
        }}
        defaultSize="large"
        // toolBarRender={() => [
        //   <CreateForm key="create" reload={actionRef.current?.reload} />,
        // ]}
        request={rule}
        columns={columns}
        dataSource={hdf5Data}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
      />
      {selectedRowsState?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              <FormattedMessage
                id="pages.searchTable.chosen"
                defaultMessage="Chosen"
              />{' '}
              <a style={{ fontWeight: 600 }}>{selectedRowsState.length}</a>{' '}
              <FormattedMessage
                id="pages.searchTable.item"
                defaultMessage="项"
              />
              &nbsp;&nbsp;
              <span>
                <FormattedMessage
                  id="pages.searchTable.totalServiceCalls"
                  defaultMessage="Total number of service calls"
                />{' '}
                {selectedRowsState.reduce(
                  (pre, item) => pre + (item.callNo ?? 0),
                  0,
                )}{' '}
                <FormattedMessage
                  id="pages.searchTable.tenThousand"
                  defaultMessage="次"
                />
              </span>
            </div>
          }
        >
          <Button
            loading={loading}
            onClick={() => {
              handleRemove(selectedRowsState);
            }}
          >
            <FormattedMessage
              id="pages.searchTable.batchDeletion"
              defaultMessage="Batch deletion"
            />
          </Button>
          <Button type="primary">
            <FormattedMessage
              id="pages.searchTable.batchApproval"
              defaultMessage="Batch approval"
            />
          </Button>
        </FooterToolbar>
      )}

      <Drawer
        width={1200}
        open={showDetail}
        onClose={() => {
          setCurrentRow(undefined);
          setShowDetail(false);
        }}
        closable={false}
        title="HDF5数据浏览"
        placement="bottom"
      >
        {currentRow?.name && (
          <>
          <ProDescriptions<API.RuleListItem>
            column={2}
            title={currentRow?.name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.name,
            }}
            columns={columns_drawer as ProDescriptionsItemProps<API.RuleListItem>[]}
          />
          {/* <Descriptions
            >
              <div id="video-container">
                  <div style={{marginTop: 23 ,width: "100%", height: 600, backgroundColor: 'black', color: 'white'}} id="video-placeholder">
                      <span style={{marginLeft:5,fontSize:15}}>加载HDF5文件...</span>
                  </div>
              </div>
          </Descriptions> */}
        </>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default TableList;
