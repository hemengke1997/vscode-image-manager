import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { difference, isEqual } from 'lodash-es'
import GlobalContext from '~/webview/image-manager/contexts/global-context'
import SettingsContext from '~/webview/image-manager/contexts/settings-context'

export default function useSyncImageTypes(onChange: (types: string[]) => void) {
  const { displayImageTypes } = SettingsContext.usePicker(['displayImageTypes'])

  const { allImageTypes } = GlobalContext.usePicker(['allImageTypes'])

  const setupImageDisplayTypes = useMemoizedFn((reset = false) => {
    const _reset = () => {
      onChange(allImageTypes)
    }
    if (reset) {
      _reset()
      return
    }
    try {
      const shouldCheckedTypes = displayImageTypes?.unchecked.length
        ? difference(allImageTypes, displayImageTypes.unchecked)
        : allImageTypes

      // avoid unnecessary render
      if (!isEqual(shouldCheckedTypes, displayImageTypes?.checked)) {
        onChange(shouldCheckedTypes)
      }
    } catch {
      _reset()
    }
  })

  useUpdateEffect(() => {
    setupImageDisplayTypes()
  }, [allImageTypes])
}
