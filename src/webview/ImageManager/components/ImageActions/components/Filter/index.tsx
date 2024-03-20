import { isNil, isObject, upperFirst } from '@minko-fe/lodash-pro'
import { Button, ConfigProvider, Divider, Form, InputNumber, Popover, Segmented, Space } from 'antd'
import { produce } from 'immer'
import { memo, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbFilter } from 'react-icons/tb'
import GlobalContext, { type RestrictImageFilterType } from '~/webview/ImageManager/contexts/GlobalContext'

function deepTruly(v: Object | number | undefined): boolean {
  if (isObject(v)) {
    return Object.values(v).some((v) => deepTruly(v))
  }
  return !!v
}

export const enum FilterRadioValue {
  all = 0,
  yes = 1,
  no = 2,
}

/**
 * key: ImageVisibleFilterType 一一对应，方便使用
 */
export type ImageFilterAction = RestrictImageFilterType<{
  size: {
    min?: number
    max?: number
  }
  /**
   * @type 0: all, 1: yes, 2: no
   */
  git_staged: ValueOf<typeof FilterRadioValue>
  /**
   * @type 0: all, 1: yes, 2: no
   */
  compressed: ValueOf<typeof FilterRadioValue>
}>

function Filter() {
  const { t } = useTranslation()
  const { imageFilter, setImageFilter } = GlobalContext.usePicker(['imageFilter', 'setImageFilter'])

  const initialFilter = useRef(imageFilter)

  const [open, setOpen] = useState(false)

  const [filterForm] = Form.useForm<ImageFilterAction>()

  const filterImagesByFormResult = (value: ImageFilterAction) => {
    const { compressed, git_staged, size } = value

    setImageFilter(
      produce((draft) => {
        draft.size.min = size.min
        draft.size.max = size.max
        draft.git_staged = git_staged
        draft.compressed = compressed
      }),
    )
  }

  const isActive = useMemo(() => {
    return deepTruly({
      size: imageFilter.size,
      git_staged: imageFilter.git_staged,
      compressed: imageFilter.compressed,
    })
  }, [imageFilter])

  return (
    <Popover
      title={upperFirst(t('im.filter'))}
      trigger={'click'}
      placement='left'
      afterOpenChange={(open) => {
        if (!open) {
          filterForm.setFieldsValue(imageFilter || initialFilter.current)
        }
      }}
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
      }}
      content={
        <>
          <ConfigProvider
            theme={{
              components: {
                Form: {
                  itemMarginBottom: 0,
                },
              },
            }}
          >
            <Form
              layout='horizontal'
              name='size'
              colon={false}
              form={filterForm}
              onFinish={(value) => {
                filterImagesByFormResult(value)
                setOpen(false)
              }}
              className={'space-y-4'}
              initialValues={initialFilter.current}
            >
              {/* size */}
              <Form.Item label={t('im.size')}>
                <div className={'flex items-center space-x-2'}>
                  <Space.Compact>
                    <Form.Item
                      noStyle
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const max = getFieldValue(['size', 'max'])
                            if (!isNil(max) && !isNil(value) && value > max) {
                              return Promise.reject(new Error(t('im.size_filter_tip')))
                            }
                            return Promise.resolve()
                          },
                        }),
                      ]}
                      name={['size', 'min']}
                      dependencies={[['size', 'max']]}
                    >
                      <InputNumber placeholder={`${t('im.min')}(kb)`} min={0} onPressEnter={filterForm.submit} />
                    </Form.Item>
                    <Form.Item
                      noStyle
                      name={['size', 'max']}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const min = getFieldValue(['size', 'min'])
                            if (!isNil(min) && !isNil(value) && value < min) {
                              return Promise.reject()
                            }
                            return Promise.resolve()
                          },
                        }),
                      ]}
                      dependencies={[['size', 'min']]}
                    >
                      <InputNumber placeholder={`${t('im.max')}(kb)`} min={0} onPressEnter={filterForm.submit} />
                    </Form.Item>
                  </Space.Compact>
                </div>
              </Form.Item>
              {/* git staged */}
              <Form.Item label={t('im.git_staged')} name={'git_staged'}>
                <Segmented
                  size='small'
                  options={[
                    {
                      value: FilterRadioValue.all,
                      label: t('im.all'),
                    },
                    {
                      value: FilterRadioValue.yes,
                      label: t('im.yes'),
                    },
                    {
                      value: FilterRadioValue.no,
                      label: t('im.no'),
                    },
                  ]}
                ></Segmented>
              </Form.Item>
              <Form.Item label={t('im.compressed')} name='compressed'>
                <Segmented
                  size='small'
                  options={[
                    {
                      value: FilterRadioValue.all,
                      label: t('im.all'),
                    },
                    {
                      value: FilterRadioValue.yes,
                      label: t('im.yes'),
                    },
                    {
                      value: FilterRadioValue.no,
                      label: t('im.no'),
                    },
                  ]}
                ></Segmented>
              </Form.Item>

              <Divider></Divider>
              <div className={'flex w-full justify-center gap-x-2'}>
                <Button
                  size='small'
                  type='primary'
                  onClick={() => {
                    filterForm.submit()
                  }}
                >
                  {t('im.confirm')}
                </Button>
                <Button
                  size='small'
                  type='default'
                  onClick={() => {
                    filterForm.resetFields()
                    filterForm.submit()
                  }}
                >
                  {t('im.reset')}
                </Button>
              </div>
            </Form>
          </ConfigProvider>
        </>
      }
    >
      <Button
        type={isActive ? 'primary' : 'text'}
        icon={
          <div className={'flex items-center text-xl'}>
            <TbFilter />
          </div>
        }
        title={t('im.filter')}
      />
    </Popover>
  )
}

export default memo(Filter)
