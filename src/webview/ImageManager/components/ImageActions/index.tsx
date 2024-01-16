import { isNil } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { App, Button, Form, InputNumber, Popover, Space } from 'antd'
import { memo } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { MdImageSearch } from 'react-icons/md'
import { RiFilter2Line } from 'react-icons/ri'
import { TbLayoutNavbarExpand, TbRefresh } from 'react-icons/tb'
import ActionContext from '../../contexts/ActionContext'
import { Keybinding } from '../../keybinding'

function ImageActions() {
  const { t } = useTranslation()
  const { setCollapseOpen, refreshImages, sizeFilter, setSizeFilter, imageSearchOpen, setImageSearchOpen } =
    ActionContext.usePicker([
      'setCollapseOpen',
      'refreshImages',
      'sizeFilter',
      'setSizeFilter',
      'imageSearchOpen',
      'setImageSearchOpen',
    ])

  const { message } = App.useApp()
  const [sizeForm] = Form.useForm()

  const filterImagesBySize = (value: { min?: number; max?: number }) => {
    const { min, max } = value

    if (isNil(min) && isNil(max)) {
      setSizeFilter({ active: false, value })
    } else {
      setSizeFilter({ active: true, value })
    }
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
      <Popover
        trigger={'click'}
        afterOpenChange={(open) => {
          if (!open) {
            sizeForm.setFieldsValue(sizeFilter?.value)
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
                <div>{t('im.size')}</div>
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
                    <InputNumber placeholder={`${t('im.min')}(kb)`} min={0} onPressEnter={sizeForm.submit} />
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
                    <InputNumber placeholder={`${t('im.max')}(kb)`} min={0} onPressEnter={sizeForm.submit} />
                  </Form.Item>
                </Space.Compact>
                <Form.Item noStyle>
                  <Button.Group>
                    <Button size='small' type='primary' onClick={sizeForm.submit}>
                      {t('im.submit')}
                    </Button>
                    <Button
                      size='small'
                      type='default'
                      onClick={() => {
                        sizeForm.resetFields()
                        sizeForm.submit()
                      }}
                    >
                      {t('im.reset')}
                    </Button>
                  </Button.Group>
                </Form.Item>
              </div>
            </Form>
          </>
        }
      >
        <Button
          type={sizeFilter?.active ? 'primary' : 'text'}
          icon={
            <div className={'flex-center text-xl'}>
              <RiFilter2Line />
            </div>
          }
          title={t('im.filter')}
        />
      </Popover>
      <Popover
        trigger='click'
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
