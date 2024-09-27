import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'antd'
import { TbFilter } from 'react-icons/tb'
import FilterContext from '~/webview/image-manager/contexts/filter-context'
import useImageFilter from '~/webview/image-manager/hooks/use-image-filter/use-image-filter'

function Filter() {
  const { t } = useTranslation()
  const { isImageFilterActive } = FilterContext.usePicker(['isImageFilterActive'])

  const [showImageFilter] = useImageFilter()

  return (
    <Button
      type={isImageFilterActive ? 'primary' : 'text'}
      icon={
        <div className={'flex items-center text-xl'}>
          <TbFilter />
        </div>
      }
      title={t('im.filter')}
      onClick={showImageFilter}
    />
  )
}

export default memo(Filter)
