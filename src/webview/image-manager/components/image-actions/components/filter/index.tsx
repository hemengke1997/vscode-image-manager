import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { TbFilter } from 'react-icons/tb'
import { Button, Tooltip } from 'antd'
import useImageFilter from '~/webview/image-manager/hooks/use-image-filter/use-image-filter'
import FilterStore from '~/webview/image-manager/stores/filter-store'

function Filter() {
  const { t } = useTranslation()
  const { isImageFilterActive } = FilterStore.useStore(['isImageFilterActive'])

  const { showImageFilter } = useImageFilter()

  return (
    <Tooltip title={t('im.filter')} arrow={false} placement={'bottom'}>
      <Button
        type={isImageFilterActive ? 'primary' : 'text'}
        icon={
          <div className={'flex items-center text-xl'}>
            <TbFilter />
          </div>
        }
        onClick={showImageFilter}
      />
    </Tooltip>
  )
}

export default memo(Filter)
