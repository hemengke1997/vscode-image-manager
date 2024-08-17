import { useMemoizedFn } from '@minko-fe/react-hook'
import { App, Button, InputNumber, Popconfirm } from 'antd'
import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatBytes } from '~/webview/image-manager/utils'

type Props = {
  errorRange: number
  onErrorRangeChange: (errorRange: number) => void
}

function ErrorRange(props: Props) {
  const { errorRange, onErrorRangeChange } = props
  const { t } = useTranslation()
  const { message } = App.useApp()

  const [internalErrorRange, setInternalErrorRange] = useState<number | null>(errorRange)

  const onConfirmUpdateErrorRange = useMemoizedFn(() => {
    if (internalErrorRange) {
      onErrorRangeChange(internalErrorRange)
      message.success(t('im.modify_success'))
    }
  })

  const errorRangeByte = useMemo(() => errorRange * 1024, [errorRange])

  return (
    <Popconfirm
      title={t('im.modify_error_range')}
      okText={t('im.confirm')}
      cancelText={t('im.cancel')}
      onConfirm={onConfirmUpdateErrorRange}
      afterOpenChange={(open) => {
        if (!open) {
          setInternalErrorRange(errorRange)
        }
      }}
      description={
        <InputNumber
          placeholder={`${t('im.error_range')}`}
          min={0}
          onPressEnter={onConfirmUpdateErrorRange}
          className={'my-2'}
          value={internalErrorRange}
          onChange={(value) => setInternalErrorRange(value)}
          addonAfter='KB'
        />
      }
    >
      <Button className={'text-ant-color-warning-text ml-1'}>
        ({t('im.error_range')}: {formatBytes(errorRangeByte)})
      </Button>
    </Popconfirm>
  )
}

export default memo(ErrorRange)
