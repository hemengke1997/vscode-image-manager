import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { FaUndoAlt } from 'react-icons/fa'
import { Button, Tooltip } from 'antd'
import { triggerOnce } from '~/webview/image-manager/utils'

function UndoAction(props: { onClick: () => void }) {
  const { onClick } = props
  const { t } = useTranslation()
  return (
    <Tooltip title={t('im.undo')} placement={'bottom'}>
      <Button
        onClick={triggerOnce(() => {
          onClick()
        })}
        type={'text'}
        icon={<FaUndoAlt />}
      ></Button>
    </Tooltip>
  )
}

export default memo(UndoAction)
