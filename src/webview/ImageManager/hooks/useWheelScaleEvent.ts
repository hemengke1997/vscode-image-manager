import { round } from '@minko-fe/lodash-pro'
import { useDebounceFn } from '@minko-fe/react-hook'
import { useLayoutEffect, useRef } from 'react'
import { ConfigKey } from '~/core/config/common'
import { useConfiguration } from '~/webview/hooks/useConfiguration'
import GlobalContext from '../contexts/GlobalContext'

function useWheelScaleEvent() {
  const { update } = useConfiguration()
  const { setImageWidth, imageWidth } = GlobalContext.usePicker(['setImageWidth', 'imageWidth'])

  const ref = useRef<HTMLDivElement>(null)

  const closeDefault = (e: Event) => {
    if (e.preventDefault) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const updateWidth = () => {
    update({ key: ConfigKey.viewer_imageWidth, value: imageWidth })
  }

  const debounceUpdateWidth = useDebounceFn(updateWidth)

  const handleWheel = (event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      closeDefault(event)

      const delta = event.deltaY

      const maxDelta = Math.abs(delta)

      if (delta > 0) {
        // 缩小
        setImageWidth((prevWidth) => Math.max(30, round(prevWidth! - maxDelta, 0)))
        debounceUpdateWidth.run()
      } else if (delta < 0) {
        // 放大
        setImageWidth((prevWidth) => Math.min(600, round(prevWidth! + maxDelta, 0)))
        debounceUpdateWidth.run()
      }
      return false
    }
  }

  useLayoutEffect(() => {
    ref.current?.addEventListener('wheel', handleWheel, { passive: false })
    return () => ref?.current?.removeEventListener('wheel', handleWheel)
  }, [])

  return [ref] as const
}

export default useWheelScaleEvent
