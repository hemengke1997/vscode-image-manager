import type { ImperativeModalProps } from '~/webview/image-manager/hooks/use-imperative-antd-modal'
import { Button, Form, type InputProps, Space } from 'antd'
import { isString } from 'es-toolkit'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AutoFocusInput from '../../components/auto-focus-input'

interface Props {
  /**
   * 当前名称
   */
  currentName: string
  /**
   * 表单提交回调
   */
  onSubmit: (newName: string, type: string) => Promise<void>
  /**
   * 类型，文件 | 文件夹
   */
  type: string
  /**
   * 透传给 Input 的 props
   */
  inputProps?: InputProps
}

function Rename(props: Props & ImperativeModalProps) {
  const { t } = useTranslation()
  const { currentName, closeModal, onSubmit, type, inputProps } = props

  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  return (
    <Form
      form={form}
      initialValues={{
        rename: currentName,
      }}
      onFinish={async (value) => {
        setLoading(true)

        const { rename } = value
        if (rename === currentName || !rename) {
          return closeModal()
        }

        try {
          await onSubmit(rename, type)
          closeModal()
        }
        catch (e) {
          form.setFields([{ name: 'rename', errors: [(e as string) || t('im.rename_failed')] }])
        }
        finally {
          setLoading(false)
        }
      }}
      className='mt-6'
    >
      <Form.Item
        rules={[
          () => ({
            validateTrigger: ['onSubmit'],
            async validator(_, value) {
              if (isString(value) && value.match(/\//)) {
                return Promise.reject(t('im.file_name_invalid', { type }))
              }
              if (value === currentName) {
                return Promise.resolve()
              }

              return Promise.resolve()
            },
          }),
        ]}
        name='rename'
      >
        <AutoFocusInput size='middle' placeholder={currentName} {...inputProps} />
      </Form.Item>
      <div className='flex justify-end'>
        <Space>
          <Button
            onClick={() => {
              closeModal()
            }}
          >
            {t('im.cancel')}
          </Button>
          <Button htmlType='submit' type='primary' loading={loading}>
            {t('im.confirm')}
          </Button>
        </Space>
      </div>
    </Form>
  )
}

export default memo(Rename)
