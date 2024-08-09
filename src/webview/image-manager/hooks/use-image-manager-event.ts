import EventEmitter from 'eventemitter3'
import { useEffect, useRef } from 'react'
import { type SetRequired } from 'type-fest'

/**
 * singleton
 */
class ImageManagerEvent extends EventEmitter<Events> {
  private static instance: ImageManagerEvent

  private constructor() {
    super()
  }

  static getInstance() {
    if (!ImageManagerEvent.instance) {
      ImageManagerEvent.instance = new ImageManagerEvent()
    }

    return ImageManagerEvent.instance
  }
}

type Ev<T extends Events, EventName extends EventEmitter.EventNames<T> = EventEmitter.EventNames<T>> = {
  [key in EventName]?: EventEmitter.EventListener<Events, key>
}

type Events = {
  /**
   * 删除图片
   */
  delete: [images: ImageType[]]
  /**
   * 重命名图片
   */
  rename: [previosImage: ImageType, newImage: ImageType]
  /**
   * 在viewer中显示图片
   */
  reveal_in_viewer: [image: SetRequired<Partial<ImageType>, 'path'>]
  /**
   * 右键图片
   */
  context_menu: [image: ImageType, id: string]
  /**
   * 删除目录
   */
  delete_directory: [dirPath: string]
  /**
   * 重命名目录
   */
  rename_directory: [previosDirPath: string, newDirPath: string]
}

/**
 * 全局事件管理
 */
export default function useImageManagerEvent(events?: { on?: Ev<Events>; once?: Ev<Events> }) {
  const ref = useRef<ImageManagerEvent>(ImageManagerEvent.getInstance())

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
    imageManagerEvent: ref.current,
  }
}
