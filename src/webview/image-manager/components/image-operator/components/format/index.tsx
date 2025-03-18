import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, Segmented } from 'antd'
import { upperCase } from 'es-toolkit'

function Format(props: { exts: string[] | undefined }) {
  const { exts } = props
  const { t } = useTranslation()
  return (
    <Form.Item label={t('im.format')} name={'format'} className='center'>
      <Segmented
        options={[
          {
            value: '',
            label: t('im.original'),
          },
          ...(exts?.map((item) => ({
            value: item,
            label: upperCase(item),
          })) || []),
        ]}
      ></Segmented>
    </Form.Item>
  )
}

export default memo(Format)
