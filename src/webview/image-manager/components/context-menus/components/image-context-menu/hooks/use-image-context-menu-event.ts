import EventEmitter from 'eventemitter3'
import { useEffect, useRef } from 'react'

type Events = {
  /**
   * 删除图片
   */
  delete: [images: ImageType[]]
  /**
   * 重命名
   */
  rename: [previosImage: ImageType, newImage: ImageType]
  /**
   * 在viewer中显示图片
   */
  reveal_in_viewer: [image: ImageType]
  /**
   * 右键图片
   */
  context_menu: [image: ImageType, id: string]
}

/**
 * singleton
 */
class ImageContextMenuEvent extends EventEmitter<Events> {
  private static instance: ImageContextMenuEvent

  private constructor() {
    super()
  }

  static getInstance() {
    if (!ImageContextMenuEvent.instance) {
      ImageContextMenuEvent.instance = new ImageContextMenuEvent()
    }

    return ImageContextMenuEvent.instance
  }
}

type Ev<T extends Events, EventName extends EventEmitter.EventNames<T> = EventEmitter.EventNames<T>> = {
  [key in EventName]?: EventEmitter.EventListener<Events, key>
}

export default function useImageContextMenuEvent(events?: { on?: Ev<Events>; once?: Ev<Events> }) {
  const ref = useRef<ImageContextMenuEvent>(ImageContextMenuEvent.getInstance())

  useEffect(() => {
    const hanleEvent = (type: 'on' | 'off') => {
      if (events) {
        Object.keys(events).forEach((key) => {
          if (events[key]) {
            for (const eventName in events[key]) {
              ref.current[type](eventName as keyof Events, events[key][eventName])
            }
          }
        })
      }
    }

    const registerEvent = () => {
      hanleEvent('on')
      return () => {
        hanleEvent('off')
      }
    }

    const unregister = registerEvent()

    return () => {
      unregister?.()
    }
  }, [])

  return {
    imageContextMenuEvent: ref.current,
  }
}
