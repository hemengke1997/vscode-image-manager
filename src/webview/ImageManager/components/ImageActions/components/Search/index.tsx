import { Button } from 'antd'
import { memo } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { MdImageSearch } from 'react-icons/md'
import ActionContext from '~/webview/ImageManager/contexts/ActionContext'
import { Keybinding } from '~/webview/ImageManager/keybinding'

function Search() {
  const { t } = useTranslation()
  const { setImageSearchOpen, imageSearchOpen } = ActionContext.usePicker(['setImageSearchOpen', 'imageSearchOpen'])

  useHotkeys<HTMLDivElement>(
    `mod+f`,
    () => {
      if (!imageSearchOpen) {
        setImageSearchOpen(true)
      }
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
      onClick={() => setImageSearchOpen(true)}
      title={`${t('im.search')} (${Keybinding.Search})`}
    ></Button>
  )
}

export default memo(Search)
