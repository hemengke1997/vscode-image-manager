import { useUpdateEffect } from 'ahooks'
import { produce } from 'immer'
import GlobalContext from '~/webview/image-manager/contexts/global-context'
import SettingsContext from '~/webview/image-manager/contexts/settings-context'

export default function useSyncImageTypes() {
  const { displayImageTypes } = SettingsContext.usePicker(['displayImageTypes'])

  const { setImageFilter } = GlobalContext.usePicker(['setImageFilter'])

  useUpdateEffect(() => {
    setImageFilter(
      produce((draft) => {
        draft.file_type = displayImageTypes.checked
      }),
    )
  }, [displayImageTypes.checked])
}
