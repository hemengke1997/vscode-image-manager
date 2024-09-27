import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Form, type InputProps } from 'antd'
import { isString } from 'lodash-es'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '~/webview/vscode-api'
import AutoFocusInput from '../../components/auto-focus-input'
import { type ImperativeModalProps } from '../use-imperative-modal'

type Props = {
  /**
   * 当前名称
   */
  currentName: string
  /**
   * 完整路径
   */
  path: string
  /**
   * 表单提交成功回调
   */
  onFinish: (newName: string) => Promise<void | boolean>
  /**
   * 类型，文件 | 文件夹
   */
  type: string
  /**
   * 透传给 Input 的 props
   */
  inputProps?: InputProps
}

function RenameImage(props: Props & ImperativeModalProps) {
  const { t } = useTranslation()
  const { currentName, onClose, onFinish, path, type, inputProps } = props

  return (
    <Form
      initialValues={{
        rename: currentName,
      }}
      onFinish={async (value) => {
        const { rename } = value
        if (rename === currentName || !rename) {
          return onClose()
        }
        await onFinish(rename)
        onClose()
      }}
      className={'mt-6'}
    >
      <Form.Item
        rules={[
          () => ({
            validateTrigger: ['onSubmit'],
            async validator(_, value) {
              if (isString(value) && value.match(/[\/]/)) {
                return Promise.reject(t('im.file_name_invalid', { type }))
              }
              if (value === currentName) {
                return Promise.resolve()
              }
              const existNames = await new Promise<string[]>((resolve) => {
                vscodeApi.postMessage(
                  {
                    cmd: CmdToVscode.get_sibling_resource,
                    data: {
                      source: path,
                    },
                  },
                  (res) => {
                    resolve(res)
                  },
                )
              })
              if (existNames.some((t) => t === value)) {
                return Promise.reject(t('im.file_exsits', { type }))
              }
              return Promise.resolve()
            },
          }),
        ]}
        name='rename'
      >
        <AutoFocusInput size={'middle'} placeholder={currentName} {...inputProps} />
      </Form.Item>
      <div className={'flex justify-end'}>
        <Button htmlType={'submit'} type={'primary'}>
          {t('im.confirm')}
        </Button>
      </div>
    </Form>
  )
}

export default memo(RenameImage)
