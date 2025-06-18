import { EventEmitter } from 'eventemitter3'
import { useEffect } from 'react'

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
  /**
   * 删除图片
   */
  delete = 'delete',
  /**
   * 重命名图片
   */
  rename = 'rename',
  /**
   * 在viewer中显示图片
   */
  reveal_in_viewer = 'reveal_in_viewer',
  /**
   * 清除图片reveal
   */
  clear_image_reveal = 'clear_image_reveal',
  /**
   * 右键图片
   */
  context_menu = 'context_menu',
  /**
   * 删除目录
   */
  delete_directory = 'delete_directory',
  /**
   * 重命名目录
   */
  rename_directory = 'rename_directory',
  /**
   * 清空viewer中图片选中
   */
  clear_viewer_selected_images = 'clear_viewer_selected_images',
  /**
   * 清空非viewer中图片选中
   */
  clear_selected_images = 'clear_selected_images',
  /**
   * 清空viewer中剪切图片
   */
  clear_viewer_cut_images = 'clear_viewer_cut_images',
}

interface Events {
  [IMEvent.delete]: [images: ImageType[]]
  [IMEvent.rename]: [previosImage: ImageType, newImage: ImageType]
  [IMEvent.reveal_in_viewer]: [imagePath: string]
  [IMEvent.clear_image_reveal]: []
  [IMEvent.context_menu]: [image: ImageType, id: string]
  [IMEvent.delete_directory]: [dirPath: string]
  [IMEvent.rename_directory]: [previousDirPath: string, newDirPath: string]
  [IMEvent.clear_viewer_selected_images]: []
  [IMEvent.clear_selected_images]: []
  [IMEvent.clear_viewer_cut_images]: []
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
  }, [events?.on])

  return {
    imageManagerEvent: instance,
  }
}
