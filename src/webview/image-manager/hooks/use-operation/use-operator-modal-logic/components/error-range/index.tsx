import { memo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMemoizedFn } from 'ahooks'
import { App, Button, InputNumber, Popconfirm } from 'antd'

type Props = {
  errorRange: number
  onErrorRangeChange: (errorRange: number) => void
}

function ErrorRange(props: Props) {
  const { errorRange, onErrorRangeChange } = props
  const { t } = useTranslation()
  const { message } = App.useApp()

  const ref = useRef<HTMLInputElement>(null)
  const [internalErrorRange, setInternalErrorRange] = useState<number | null>(errorRange)

  const onConfirmUpdateErrorRange = useMemoizedFn(() => {
    if (internalErrorRange) {
      onErrorRangeChange(internalErrorRange)
      message.success(t('im.modify_success'))
    }
  })

  return (
    <Popconfirm
      title={t('im.modify_error_range')}
      okText={t('im.confirm')}
      cancelText={t('im.cancel')}
      onConfirm={onConfirmUpdateErrorRange}
      afterOpenChange={(open) => {
        if (open) {
          ref.current?.focus()
        }
        if (!open) {
          setInternalErrorRange(errorRange)
        }
      }}
      description={
        <InputNumber
          placeholder={`${t('im.error_range')}`}
          min={0}
          onPressEnter={onConfirmUpdateErrorRange}
          className={'my-1'}
          value={internalErrorRange}
          onChange={(value) => setInternalErrorRange(value)}
          addonAfter='KB'
          ref={ref}
        />
      }
    >
      <Button className={'ml-1 text-ant-color-warning-text'}>
        ({t('im.error_range')}: {errorRange}KB)
      </Button>
    </Popconfirm>
  )
}

export default memo(ErrorRange)
