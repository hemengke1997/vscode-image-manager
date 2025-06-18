import { Button, Tooltip } from 'antd'
import { diff } from 'deep-object-diff'
import { flatten } from 'flat'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TbFilter } from 'react-icons/tb'
import removeUndefinedObjects from 'remove-undefined-objects'
import { DEFAULT_WORKSPACE_STATE } from '~/core/persist/workspace/common'
import useImageFilter from '~/webview/image-manager/hooks/use-image-filter/use-image-filter'
import { useImageFilter as useImageFilterState } from '~/webview/image-manager/stores/action/hooks'

function Filter() {
  const { t } = useTranslation()

  const [imageFilter] = useImageFilterState()

  const isImageFilterActive = useMemo(() => {
    const diffs = diff(
      removeUndefinedObjects(DEFAULT_WORKSPACE_STATE.image_filter) || {},
      removeUndefinedObjects(imageFilter) || {},
    )
    const diffKeys = Object.keys(flatten(diffs))
    const ignoreKeys = ['size.unit']

    return diffKeys.filter(key => !ignoreKeys.includes(key)).length
  }, [imageFilter])

  const { showImageFilter } = useImageFilter()

  return (
    <Tooltip title={t('im.filter')} arrow={false} placement='bottom'>
      <Button
        type={isImageFilterActive ? 'primary' : 'text'}
        icon={(
          <div className='flex items-center text-xl'>
            <TbFilter />
          </div>
        )}
        onClick={showImageFilter}
      />
    </Tooltip>
  )
}

export default memo(Filter)
