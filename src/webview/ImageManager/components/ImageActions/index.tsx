import { isNil, isObject, upperFirst } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { App, Button, ConfigProvider, Divider, Form, InputNumber, Popover, Radio, Space } from 'antd'
import { memo, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { MdImageSearch } from 'react-icons/md'
import { RiFilter2Line } from 'react-icons/ri'
import { TbLayoutNavbarExpand, TbRefresh } from 'react-icons/tb'
import ActionContext from '../../contexts/ActionContext'
import { Keybinding } from '../../keybinding'

export enum FilterRadioValue {
  all = 0,
  yes = 1,
  no = 2,
}

/**
 * key: ImageVisibleFilterType 一一对应，方便使用
 */
export type ImageFilterFormValue = {
  size: {
    min?: number
    max?: number
  }
  /**
   * @type 0: all, 1: yes, 2: no
   */
  git_staged?: ValueOf<typeof FilterRadioValue>
  /**
   * @type 0: all, 1: yes, 2: no
   */
  compressed?: ValueOf<typeof FilterRadioValue>
}

function ImageActions() {
  const { t } = useTranslation()
  const { setCollapseOpen, refreshImages, imageFilter, setImageFilter, imageSearchOpen, setImageSearchOpen } =
    ActionContext.usePicker([
      'setCollapseOpen',
      'refreshImages',
      'imageFilter',
      'setImageFilter',
      'imageSearchOpen',
      'setImageSearchOpen',
    ])

  const { message } = App.useApp()
  const [open, setOpen] = useState(false)

  const [filterForm] = Form.useForm<ImageFilterFormValue>()
  const FilterFormInitialValues: ImageFilterFormValue = {
    size: {
      min: undefined,
      max: undefined,
    },
    git_staged: 0,
    compressed: 0,
  }

  const filterImagesByFormResult = (value: ImageFilterFormValue) => {
    const active = (() => {
      function deepTruly(v: Object | number | undefined) {
        if (isObject(v)) {
          return Object.values(v).some((v) => deepTruly(v))
        }
        return v
      }
      return deepTruly(value)
    })()

    setImageFilter({ active, value })
  }

  const toggleAllCollapse = useMemoizedFn((b: boolean) => {
    setCollapseOpen((t) => t + (b ? 1 : -1))
  })

  useHotkeys<HTMLDivElement>(
    `mod+f`,
    () => {
      if (!imageSearchOpen) {
        setImageSearchOpen(true)
      }
    },
    {
      enabled: true,
    },
  )

  return (
    <div className={'space-x-2'}>
      {/* Filter */}
      <Popover
        title={upperFirst(t('im.filter'))}
        trigger={'click'}
        placement='left'
        afterOpenChange={(open) => {
          if (!open) {
            filterForm.setFieldsValue(imageFilter?.value || FilterFormInitialValues)
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
                onFinishFailed={({ errorFields }) => {
                  errorFields.some((item) => {
                    if (item.errors.length) {
                      message.error(item.errors[0])
                      return true
                    }
                    return false
                  })
                }}
                onFinish={(value) => {
                  filterImagesByFormResult(value)
                }}
                className={'space-y-4'}
                initialValues={{
                  git_staged: 0,
                  compressed: 0,
                }}
              >
                {/* size */}
                <Form.Item label={t('im.size')}>
                  <div className={'flex-center space-x-2'}>
                    <Space.Compact>
                      <Form.Item
                        noStyle
                        rules={[
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const max = getFieldValue('max')
                              if (!isNil(max) && !isNil(value) && value > max) {
                                return Promise.reject(new Error('min must less than max'))
                              }
                              return Promise.resolve()
                            },
                          }),
                        ]}
                        name={['size', 'min']}
                      >
                        <InputNumber placeholder={`${t('im.min')}(kb)`} min={0} onPressEnter={filterForm.submit} />
                      </Form.Item>
                      <Form.Item
                        noStyle
                        name={['size', 'max']}
                        rules={[
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const min = getFieldValue('min')
                              if (!isNil(min) && !isNil(value) && value < min) {
                                return Promise.reject()
                              }
                              return Promise.resolve()
                            },
                          }),
                        ]}
                      >
                        <InputNumber placeholder={`${t('im.max')}(kb)`} min={0} onPressEnter={filterForm.submit} />
                      </Form.Item>
                    </Space.Compact>
                  </div>
                </Form.Item>
                {/* git staged */}
                <Form.Item label={t('im.git_staged')} name={'git_staged'}>
                  <Radio.Group optionType='button' buttonStyle='solid' name='git-filter'>
                    <Radio value={FilterRadioValue.all}>{t('im.all')}</Radio>
                    <Radio value={FilterRadioValue.yes}>{t('im.yes')}</Radio>
                    <Radio value={FilterRadioValue.no}>{t('im.no')}</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item label={t('im.compressed')} name='compressed'>
                  <Radio.Group optionType='button' buttonStyle='solid' name='compressed-filter'>
                    <Radio value={FilterRadioValue.all}>{t('im.all')}</Radio>
                    <Radio value={FilterRadioValue.yes}>{t('im.yes')}</Radio>
                    <Radio value={FilterRadioValue.no}>{t('im.no')}</Radio>
                  </Radio.Group>
                </Form.Item>

                <Divider></Divider>
                <div className={'flex w-full justify-center gap-x-2'}>
                  <Button
                    size='small'
                    type='primary'
                    onClick={() => {
                      filterForm.submit()
                      setOpen(false)
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
                      setOpen(false)
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
          type={imageFilter?.active ? 'primary' : 'text'}
          icon={
            <div className={'flex-center text-xl'}>
              <RiFilter2Line />
            </div>
          }
          title={t('im.filter')}
        />
      </Popover>
      {/* Refresh images */}
      <Button
        type='text'
        icon={
          <div className={'flex-center text-xl'}>
            <TbRefresh />
          </div>
        }
        onClick={() => refreshImages({ type: 'refresh' })}
        title={t('im.refresh')}
      ></Button>
      {/* Search */}
      <Button
        type='text'
        icon={
          <div className={'flex-center text-xl'}>
            <MdImageSearch />
          </div>
        }
        onClick={() => setImageSearchOpen(true)}
        title={`${t('im.search')} (${Keybinding.Search})`}
      ></Button>

      {/* Layout */}
      <Popover
        trigger='click'
        placement='left'
        content={
          <div>
            <div className={'flex-center space-x-2'}>
              <div>{t('im.layout')}</div>
              <Button.Group>
                <Button
                  onClick={() => {
                    toggleAllCollapse(true)
                  }}
                >
                  {t('im.expand')}
                </Button>
                <Button
                  onClick={() => {
                    toggleAllCollapse(false)
                  }}
                >
                  {t('im.collapse')}
                </Button>
              </Button.Group>
            </div>
          </div>
        }
      >
        <Button
          type='text'
          icon={
            <div className={'flex-center text-xl'}>
              <TbLayoutNavbarExpand />
            </div>
          }
          title={t('im.action')}
        />
      </Popover>
    </div>
  )
}

export default memo(ImageActions)
