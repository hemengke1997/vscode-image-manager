import type { ImperativeModalProps } from '~/webview/image-manager/hooks/use-imperative-antd-modal'
import { useMemoizedFn } from 'ahooks'
import { Button, Checkbox, Form, Space } from 'antd'
import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Key } from 'ts-key-enum'
import { ConfigKey } from '~/core/config/common'
import { useExtConfigState } from '~/webview/image-manager/hooks/use-ext-config-state'
import AutoFocusButton from '../../components/auto-focus-button'
import { VscodeAtoms } from '../../stores/vscode/vscode-store'
import { OS } from '../../utils/device'

type Props = {
  filenames: string
  onConfirm: () => Promise<void>
}

function DeleteImage(props: Props & ImperativeModalProps) {
  const { closeModal, onConfirm, filenames } = props
  const { t } = useTranslation()
  const confirmDelete = useAtomValue(
    selectAtom(
      VscodeAtoms.extConfigAtom,
      useMemoizedFn(state => state.file.confirmDelete),
    ),
  )
  // 删除文件
  const [_, setConfirmDelete] = useExtConfigState(ConfigKey.file_confirmDelete, confirmDelete)

  const onFinish = useMemoizedFn(async (value) => {
    const { askDelete } = value
    if (askDelete) {
      setConfirmDelete(true)
    }
    await onConfirm()
    closeModal()
  })

  const [form] = Form.useForm()

  return (
    <Form
      onFinish={onFinish}
      tabIndex={-1}
      form={form}
      onKeyDown={(e) => {
        if (e.key === Key.Enter) {
          form.submit()
        }
      }}
    >
      <div className='space-y-2'>
        <div className='text-base'>{t('im.delete_title', { filename: `'${filenames}'` })}</div>
        <div className='text-sm text-ant-color-text-secondary'>
          {t('im.delete_tip', { trash: OS.isMac ? t('im.trash_macos') : t('im.trash_windows') })}
        </div>
        <Form.Item name='askDelete' initialValue={false} valuePropName='checked'>
          <Checkbox>{t('im.dont_ask_again')}</Checkbox>
        </Form.Item>
      </div>
      <div className='flex justify-end'>
        <Space>
          <Button
            onClick={() => {
              closeModal()
            }}
          >
            {t('im.cancel')}
          </Button>
          <AutoFocusButton type='primary' htmlType='submit'>
            {t('im.confirm')}
          </AutoFocusButton>
        </Space>
      </div>
    </Form>
  )
}

export default memo(DeleteImage)
