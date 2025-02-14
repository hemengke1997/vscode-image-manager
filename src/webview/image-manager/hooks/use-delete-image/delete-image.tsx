import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMemoizedFn } from 'ahooks'
import { Checkbox, Form } from 'antd'
import { Key } from 'ts-key-enum'
import { os } from 'un-detector'
import { ConfigKey } from '~/core/config/common'
import { useExtConfigState } from '~/webview/image-manager/hooks/use-ext-config-state'
import AutoFocusButton from '../../components/auto-focus-button'
import GlobalContext from '../../contexts/global-context'
import { type ImperativeModalProps } from '../use-imperative-modal'

type Props = {
  filenames: string
  onConfirm: () => Promise<void>
}

function DeleteImage(props: Props & ImperativeModalProps) {
  const { closeModal, onConfirm, filenames } = props
  const { t } = useTranslation()
  const confirmDelete = GlobalContext.useSelector((ctx) => ctx.extConfig.file.confirmDelete)
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
        <div className={'text-base'}>{t('im.delete_title', { filename: `'${filenames}'` })}</div>
        <div className={'text-sm text-ant-color-text-secondary'}>
          {t('im.delete_tip', { trash: os.isMac() ? t('im.trash_macos') : t('im.trash_windows') })}
        </div>
        <Form.Item name='askDelete' initialValue={false} valuePropName={'checked'}>
          <Checkbox>{t('im.dont_ask_again')}</Checkbox>
        </Form.Item>
      </div>
      <div className={'flex justify-end'}>
        <AutoFocusButton type={'primary'} htmlType={'submit'}>
          {t('im.confirm')}
        </AutoFocusButton>
      </div>
    </Form>
  )
}

export default memo(DeleteImage)
