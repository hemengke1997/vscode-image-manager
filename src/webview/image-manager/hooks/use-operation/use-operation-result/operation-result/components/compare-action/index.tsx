import { Button, Tooltip } from 'antd'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { MdCompare } from 'react-icons/md'
import { triggerOnce } from '~/webview/image-manager/utils'

function CompareAction(props: { onClick: () => void }) {
  const { onClick } = props

  const { t } = useTranslation()

  return (
    <Tooltip title={t('im.compare')} placement='bottom' arrow={false}>
      <Button
        onClick={triggerOnce(() => {
          onClick()
        })}
        type='text'
        icon={<MdCompare />}
      >
      </Button>
    </Tooltip>
  )
}

export default memo(CompareAction)
