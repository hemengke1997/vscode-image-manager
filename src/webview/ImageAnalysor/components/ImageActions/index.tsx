import { cloneDeep, isNil } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { App, Button, Form, InputNumber, Popover, Space } from 'antd'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MdImageSearch } from 'react-icons/md'
import { RiFilter2Line } from 'react-icons/ri'
import { TbLayoutNavbarExpand, TbRefresh } from 'react-icons/tb'
import ImageAnalysorContext from '../../contexts/ImageAnalysorContext'
import { bytesToKb } from '../../utils'

function ImageActions() {
  const { t } = useTranslation()
  const { setImages, setCollapseOpen, refreshImages } = ImageAnalysorContext.usePicker([
    'setImages',
    'setCollapseOpen',
    'refreshImages',
  ])

  const { message } = App.useApp()
  const [sizeForm] = Form.useForm()
  const [sizeFilter, setSizeFilter] = useState<{
    flag: boolean
    value: { min?: number; max?: number }
  }>()

  const filterImagesBySize = (value: { min?: number; max?: number }) => {
    const { min, max } = value

    if (isNil(min) && isNil(max)) {
      setSizeFilter({ flag: false, value })

      setImages((img) => ({
        list: img.list.map((t) => ({ ...t, visible: { ...t.visible, size: true } })),
      }))
    } else {
      setSizeFilter({ flag: true, value })

      setImages((img) => ({
        list: img.list.map((t) => ({
          ...t,
          visible: {
            ...t.visible,
            size: bytesToKb(t.stats.size) >= (min || 0) && bytesToKb(t.stats.size) <= (max || Number.POSITIVE_INFINITY),
          },
        })),
      }))
    }
  }

  const toggleAllCollapse = useMemoizedFn((b: boolean) => {
    setCollapseOpen((t) => t + (b ? 1 : -1))
  })

  return (
    <div className={'space-x-2'}>
      <Button
        type='text'
        icon={
          <div className={'flex-center text-xl'}>
            <TbRefresh />
          </div>
        }
        onClick={() => refreshImages({ type: 'refresh' })}
        title={t('ia.refresh')}
      ></Button>
      <Button
        type='text'
        icon={
          <div className={'flex-center text-xl'}>
            <MdImageSearch />
          </div>
        }
        onClick={() => message.info('Working in progress 🙌')}
        title={t('ia.find')}
      ></Button>
      <Popover
        trigger={'click'}
        afterOpenChange={(open) => {
          if (!open) {
            sizeForm.setFieldsValue(cloneDeep(sizeFilter?.value))
          }
        }}
        content={
          <>
            <Form
              layout='inline'
              name='size'
              form={sizeForm}
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
                filterImagesBySize(value)
              }}
            >
              <div className={'flex-center space-x-2'}>
                <div>{t('ia.size')}</div>
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
                    name={'min'}
                  >
                    <InputNumber placeholder={`${t('ia.min')}(kb)`} min={0} onPressEnter={sizeForm.submit} />
                  </Form.Item>
                  <Form.Item
                    noStyle
                    name={'max'}
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
                    <InputNumber placeholder={`${t('ia.max')}(kb)`} min={0} onPressEnter={sizeForm.submit} />
                  </Form.Item>
                </Space.Compact>
                <Form.Item noStyle>
                  <Button.Group>
                    <Button size='small' type='primary' onClick={sizeForm.submit}>
                      {t('ia.submit')}
                    </Button>
                    <Button
                      size='small'
                      type='default'
                      onClick={() => {
                        sizeForm.resetFields()
                        sizeForm.submit()
                      }}
                    >
                      {t('ia.reset')}
                    </Button>
                  </Button.Group>
                </Form.Item>
              </div>
            </Form>
          </>
        }
      >
        <Button
          type={sizeFilter?.flag ? 'primary' : 'text'}
          icon={
            <div className={'flex-center text-xl'}>
              <RiFilter2Line />
            </div>
          }
          title={t('ia.filter')}
        />
      </Popover>
      <Popover
        trigger='click'
        content={
          <div>
            <div className={'flex-center space-x-2'}>
              <div>{t('ia.layout')}</div>
              <Button.Group>
                <Button
                  onClick={() => {
                    toggleAllCollapse(true)
                  }}
                >
                  {t('ia.expand')}
                </Button>
                <Button
                  onClick={() => {
                    toggleAllCollapse(false)
                  }}
                >
                  {t('ia.collapse')}
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
          title={t('ia.action')}
        />
      </Popover>
    </div>
  )
}

export default memo(ImageActions)
