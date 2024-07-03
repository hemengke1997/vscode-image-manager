import { Form, Segmented } from 'antd'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

function SkipCompressed() {
  const { t } = useTranslation()

  return (
    <Form.Item label={t('im.skip_compressed')} name={'skipCompressed'} className={'center'}>
      <Segmented
        options={[
          {
            value: true,
            label: t('im.yes'),
          },
          {
            value: false,
            label: t('im.no'),
          },
        ]}
      />
    </Form.Item>
  )
}

export default memo(SkipCompressed)
