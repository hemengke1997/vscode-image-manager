import { isNil } from '@minko-fe/lodash-pro'
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
  const [sizeFiltered, setSizeFiltered] = useState(false)

  const filterImagesBySize = (value: { min?: number; max?: number }) => {
    const { min, max } = value
    if (isNil(min) && isNil(max)) {
      setSizeFiltered(false)

      setImages((img) => ({
        list: img.list.map((t) => ({ ...t, visible: { ...t.visible, size: true } })),
      }))
    } else {
      setSizeFiltered(true)

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

  return (
    <div className={'space-x-2'}>
      <Button
        type='text'
        icon={
          <div className={'flex-center text-xl'}>
            <TbRefresh />
          </div>
        }
        onClick={refreshImages}
      ></Button>
      <Button
        type='text'
        icon={
          <div className={'flex-center text-xl'}>
            <MdImageSearch />
          </div>
        }
        onClick={() => message.info('Working in progress 🙌')}
      ></Button>
      <Popover
        trigger={'click'}
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
                <div>{t('ns.size')}</div>
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
                    dependencies={['max']}
                    name={'min'}
                  >
                    <InputNumber placeholder='min(kb)' min={0} onPressEnter={sizeForm.submit} />
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
                    dependencies={['min']}
                  >
                    <InputNumber placeholder='max(kb)' min={0} onPressEnter={sizeForm.submit} />
                  </Form.Item>
                </Space.Compact>
                <Form.Item noStyle>
                  <Button.Group>
                    <Button size='small' type='primary' onClick={() => sizeForm.submit()}>
                      {t('ns.submit')}
                    </Button>
                    <Button
                      size='small'
                      type='default'
                      onClick={() => {
                        sizeForm.resetFields()
                        sizeForm.submit()
                      }}
                    >
                      {t('ns.reset')}
                    </Button>
                  </Button.Group>
                </Form.Item>
              </div>
            </Form>
          </>
        }
      >
        <Button
          type={sizeFiltered ? 'dashed' : 'text'}
          icon={
            <div className={'flex-center text-xl'}>
              <RiFilter2Line />
            </div>
          }
        />
      </Popover>
      <Popover
        trigger='click'
        content={
          <div>
            <div className={'flex-center space-x-2'}>
              <div>Layout</div>
              <Button.Group>
                <Button
                  onClick={() => {
                    setCollapseOpen(true)
                  }}
                >
                  {t('ns.expand')}
                </Button>
                <Button
                  onClick={() => {
                    setCollapseOpen(false)
                  }}
                >
                  {t('ns.collapse')}
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
        />
      </Popover>
    </div>
  )
}

export default memo(ImageActions)
