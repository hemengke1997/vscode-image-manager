import { useEffect } from 'react'
import { EventEmitter } from 'eventemitter3'

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

export enum IMEvent {
  delete = 'delete',
  rename = 'rename',
  reveal_in_viewer = 'reveal_in_viewer',
  context_menu = 'context_menu',
  delete_directory = 'delete_directory',
  rename_directory = 'rename_directory',
  clear_selected_images = 'clear_selected_images',
}

type Events = {
  /**
   * 删除图片
   */
  [IMEvent.delete]: [images: ImageType[]]
  /**
   * 重命名图片
   */
  [IMEvent.rename]: [previosImage: ImageType, newImage: ImageType]
  /**
   * 在viewer中显示图片
   */
  [IMEvent.reveal_in_viewer]: [imagePath: string]
  /**
   * 右键图片
   */
  [IMEvent.context_menu]: [image: ImageType, id: string]
  /**
   * 删除目录
   */
  [IMEvent.delete_directory]: [dirPath: string]
  /**
   * 重命名目录
   */
  [IMEvent.rename_directory]: [previosDirPath: string, newDirPath: string]
  /**
   * 清空图片选中
   */
  [IMEvent.clear_selected_images]: [excludeDir?: string]
}

const instance = ImageManagerEvent.getInstance()

/**
 * 全局事件管理
 */
export default function useImageManagerEvent(events?: { on?: Ev<Events> }) {
  useEffect(() => {
    const hanleEvent = (type: 'on' | 'off') => {
      if (events) {
        Object.keys(events).forEach((key) => {
          if (events[key]) {
            for (const eventName in events[key]) {
              instance[type](eventName as keyof Events, events[key][eventName])
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
    imageManagerEvent: instance,
  }
}
