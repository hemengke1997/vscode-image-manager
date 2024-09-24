import { memo } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { Button } from 'antd'
import { MdImageSearch } from 'react-icons/md'
import useImageSearch from '~/webview/image-manager/hooks/use-image-search/use-image-search'
import { Keybinding } from '~/webview/image-manager/keybinding'

function Search() {
  const { t } = useTranslation()
  const [showImageSearch] = useImageSearch()

  useHotkeys<HTMLDivElement>(
    `mod+f`,
    () => {
      showImageSearch()
    },
    {
      enabled: true,
    },
  )

  return (
    <Button
      type='text'
      icon={
        <div className={'flex items-center text-xl'}>
          <MdImageSearch />
        </div>
      }
      onClick={showImageSearch}
      title={`${t('im.search')} (${Keybinding.Search()})`}
    ></Button>
  )
}

export default memo(Search)
