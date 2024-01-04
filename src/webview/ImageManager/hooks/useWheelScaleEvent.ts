import { useLayoutEffect, useRef } from 'react'
import ImageManagerContext from '../contexts/ImageManagerContext'

function useWheelScaleEvent() {
  const { config, setScale } = ImageManagerContext.usePicker(['config', 'setScale'])

  const ref = useRef<HTMLDivElement>(null)

  const closeDefault = (e: Event) => {
    if (e.preventDefault) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const handleWheel = (event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      closeDefault(event)

      const delta = event.deltaY

      const scaleStep = config.scaleStep

      if (delta > 0) {
        setScale((prevScale) => Math.max(0.3, prevScale! - scaleStep))
      } else if (delta < 0) {
        setScale((prevScale) => Math.min(3, prevScale! + scaleStep))
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
