import { Form, Segmented } from 'antd'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

function KeepOriginal() {
  const { t } = useTranslation()
  return (
    <Form.Item label={t('im.keep')} name='keepOriginal' className='center'>
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

export default memo(KeepOriginal)
