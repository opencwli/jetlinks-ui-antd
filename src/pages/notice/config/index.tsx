import { PageHeaderWrapper } from '@ant-design/pro-layout';
import React, { useEffect, useState, Fragment } from 'react';
import { Card, Form, Col, Input, Row, Table, Divider, message, Button, Popconfirm } from 'antd';
import apis from '@/services';
import { Dispatch, ConnectState } from '@/models/connect';
import { connect } from 'dva';
import { FormComponentProps } from 'antd/es/form';
import encodeQueryParam from '@/utils/encodeParam';
import { downloadObject } from '@/utils/utils';
import Upload, { UploadProps } from 'antd/lib/upload';
import { PaginationConfig } from 'antd/lib/table';
import Save from './save';
import StandardFormRow from '../components/standard-form-row';
import TagSelect from '../components/tag-select';
import styles from '../index.less';
import { getAccessToken } from '@/utils/authority';
import request from '@/utils/request';
import Debug from './debugger';

interface Props extends FormComponentProps {
  dispatch: Dispatch;
  noticeConfig: any;
  loading: boolean;
}
interface State {
  typeList: any[];
  // activeType: string;
  saveVisible: boolean;
  currentItem: any;
  searchParam: any;
  filterType: string[];
  filterName: string;
  debugVisible: boolean;
}

const formItemLayout = {
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};

const Config: React.FC<Props> = props => {
  const { noticeConfig, loading, dispatch } = props;

  const initState: State = {
    typeList: [],
    // activeType: '',
    saveVisible: false,
    currentItem: {},
    searchParam: {},
    filterType: [],
    filterName: '',
    debugVisible: false,
  };
  const [typeList, setTypeList] = useState(initState.typeList);
  // const [activeType, setActiveType] = useState(initState.activeType);
  const [saveVisible, setSaveVisible] = useState(initState.saveVisible);
  const [currentItem, setCurrentItem] = useState(initState.currentItem);
  const [searchParam, setSearchParam] = useState(initState.searchParam);
  const [filterType, setFilterType] = useState(initState.filterType);
  const [filterName, setFilterName] = useState(initState.filterName);
  const [debugVisible, setDebugVisible] = useState(initState.debugVisible);

  const handlerSearch = (params?: any) => {
    dispatch({
      type: 'noticeConfig/query',
      payload: encodeQueryParam(params),
    });
    setSearchParam(params);
  };

  const onSearch = (type?: string[], name?: string) => {
    const tempType = type || filterType;
    const tempName = name || filterName;
    // console.log(tempName, 'name');
    dispatch({
      type: 'noticeConfig/query',
      payload: encodeQueryParam({
        paging: false,
        sorts: {
          field: 'id',
          order: 'desc',
        },
        terms: {
          type$IN: tempType,
          name$LIKE: tempName,
        },
      }),
    });
  };

  useEffect(() => {
    apis.notifier.configType().then((res: any) => {
      if (res) {
        setTypeList(res.result);
      }
    });
    handlerSearch({
      pageIndex: 0,
      pageSize: 10,
    });
  }, []);

  const remove = (record: any) => {
    dispatch({
      type: 'noticeConfig/remove',
      payload: record.id,
      callback: () => {
        message.error('删除成功');
        handlerSearch(searchParam);
      },
    });
  };

  const saveData = (item: any) => {
    dispatch({
      type: 'noticeConfig/insert',
      payload: item,
      callback: () => {
        message.success('保存成功');
        setSaveVisible(false);
        handlerSearch(searchParam);
      },
    });
  };

  const onTableChange = (
    pagination: PaginationConfig,
    filters: any,
    sorter: any,
    // extra: any,
  ) => {
    handlerSearch({
      pageIndex: Number(pagination.current) - 1,
      pageSize: pagination.pageSize,
      terms: searchParam,
      sorts: sorter,
    });
  };

  const uploadProps: UploadProps = {
    accept: '.json',
    action: '/jetlinks/file/static',
    headers: {
      'X-Access-Token': getAccessToken(),
    },
    showUploadList: false,
    onChange(info) {
      if (info.file.status !== 'uploading') {
        // console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        const fileUrl = info.file.response.result;
        // request(fileUrl.replace('http://2.jetlinks.org:9000/', 'jetlinks'), { method: 'GET' }).then(e => {
        request(fileUrl, { method: 'GET' }).then(e => {
          dispatch({
            type: 'noticeConfig/insert',
            payload: e,
            callback: () => {
              message.success('导入成功');
              // handleSearch(searchParam);
            },
          });
        });
      }
      if (info.file.status === 'error') {
        message.error(`${info.file.name} 导入失败.`);
      }
    },
  };

  return (
    <PageHeaderWrapper title="通知配置">
      <div className={styles.filterCardList}>
        <Card bordered={false}>
          <Form layout="inline">
            <StandardFormRow title="组件类型" block style={{ paddingBottom: 11 }}>
              <Form.Item>
                <TagSelect
                  expandable
                  onChange={(value: any[]) => {
                    setFilterType(value);
                    onSearch(value, undefined);
                  }}
                >
                  {typeList.map(item => (
                    <TagSelect.Option key={item.id} value={item.id}>
                      {item.name}
                    </TagSelect.Option>
                  ))}
                </TagSelect>
              </Form.Item>
            </StandardFormRow>
            <StandardFormRow title="其它选项" grid last>
              <Row gutter={16}>
                <Col lg={8} md={10} sm={10} xs={24}>
                  <Form.Item {...formItemLayout} label="配置名称">
                    <Input
                      onChange={e => {
                        setFilterName(e.target.value);
                        onSearch(undefined, e.target.value);
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </StandardFormRow>
          </Form>
        </Card>
        <br />
        <Card>
          <Button
            onClick={() => {
              setCurrentItem({});
              setSaveVisible(true);
            }}
            type="primary"
            style={{ marginBottom: 16 }}
          >
            新建
          </Button>
          <Divider type="vertical" />
          <Button
            onClick={() => {
              downloadObject(noticeConfig.result?.data, '通知配置');
            }}
            style={{ marginBottom: 16 }}
          >
            导出配置
          </Button>
          <Divider type="vertical" />
          <Upload {...uploadProps}>
            <Button type="primary" style={{ marginBottom: 16 }}>
              导入配置
            </Button>
          </Upload>
          <Table
            rowKey="id"
            loading={loading}
            onChange={onTableChange}
            columns={[
              {
                dataIndex: 'id',
                title: 'ID',
              },
              {
                dataIndex: 'name',
                title: '配置名称',
              },
              {
                dataIndex: 'type',
                title: '通知类型',
              },
              {
                dataIndex: 'provider',
                title: '服务商',
              },
              {
                dataIndex: 'option',
                title: '操作',
                render: (text, record: any) => (
                  <Fragment>
                    <a
                      onClick={() => {
                        setCurrentItem(record);
                        setSaveVisible(true);
                      }}
                    >
                      编辑
                    </a>
                    <Divider type="vertical" />
                    <Popconfirm
                      title="确认删除？"
                      onConfirm={() => {
                        remove(record);
                      }}
                    >
                      <a>删除</a>
                    </Popconfirm>
                    <Divider type="vertical" />
                    <a onClick={() => downloadObject(record, '通知模版')}>下载配置</a>
                    <Divider type="vertical" />
                    <a
                      onClick={() => {
                        setCurrentItem(record);
                        setDebugVisible(true);
                      }}
                    >
                      调试
                    </a>
                  </Fragment>
                ),
              },
            ]}
            dataSource={noticeConfig.result?.data}
            pagination={{
              current: noticeConfig.result?.pageIndex + 1,
              total: noticeConfig.result?.total,
              pageSize: noticeConfig.result?.pageSize,
              showQuickJumper: true,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total: number) =>
                `共 ${total} 条记录 第  ${noticeConfig.result?.pageIndex + 1}/${Math.ceil(
                  noticeConfig.result?.total / noticeConfig.result?.pageSize,
                )}页`,
            }}
          />
        </Card>
      </div>

      {saveVisible && (
        <Save
          data={currentItem}
          close={() => setSaveVisible(false)}
          save={(item: any) => saveData(item)}
        />
      )}
      {debugVisible && <Debug data={currentItem} close={() => setDebugVisible(false)} />}
    </PageHeaderWrapper>
  );
};

export default connect(({ noticeConfig, loading }: ConnectState) => ({
  noticeConfig,
  loading: loading.models.noticeConfig,
}))(Form.create<Props>()(Config));
