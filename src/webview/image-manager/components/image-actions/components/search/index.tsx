import { memo } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { MdImageSearch } from 'react-icons/md'
import { Button, Tooltip } from 'antd'
import useImageSearch from '~/webview/image-manager/hooks/use-image-search/use-image-search'
import { Keybinding } from '~/webview/image-manager/keybinding'

function Search() {
  const { t } = useTranslation()
  const { imperativeModalMap, showImageSearch } = useImageSearch()

  useHotkeys<HTMLDivElement>(
    `mod+f`,
    () => {
      // 没有已经打开的弹窗时，才能触发快捷搜索
      if (![...imperativeModalMap.keys()].length) {
        showImageSearch({})
      }
    },
    {
      enabled: true,
    },
  )

  return (
    <Tooltip title={`${t('im.search')} (${Keybinding.Search()})`} arrow={false} placement={'bottom'}>
      <Button
        type='text'
        icon={
          <div className={'flex items-center text-xl'}>
            <MdImageSearch />
          </div>
        }
        onClick={showImageSearch}
      ></Button>
    </Tooltip>
  )
}

export default memo(Search)
