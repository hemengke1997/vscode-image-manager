import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Tooltip } from 'antd'
import { TbFilter } from 'react-icons/tb'
import FilterContext from '~/webview/image-manager/contexts/filter-context'
import useImageFilter from '~/webview/image-manager/hooks/use-image-filter/use-image-filter'

function Filter() {
  const { t } = useTranslation()
  const { isImageFilterActive } = FilterContext.usePicker(['isImageFilterActive'])

  const [showImageFilter] = useImageFilter()

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
