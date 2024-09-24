import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Tooltip } from 'antd'
import { FaRedoAlt } from 'react-icons/fa'
import { triggerOnce } from '~/webview/image-manager/utils'

function RedoAction(props: { onClick: () => void }) {
  const { onClick } = props
  const { t } = useTranslation()
  return (
    <Tooltip title={t('im.retry')} placement={'bottom'}>
      <Button
        onClick={triggerOnce(() => {
          onClick()
        })}
        type={'text'}
        icon={<FaRedoAlt />}
      ></Button>
    </Tooltip>
  )
}

export default memo(RedoAction)
