import { useEffect, useRef } from 'react'
import { Emitter, type EventMap, type Listener } from 'strict-event-emitter'

type Events = {
  /**
   * 删除图片
   */
  delete: [image: ImageType]
  /**
   * 重命名
   */
  rename: [previosImage: ImageType, newImage: ImageType]
  /**
   * 在viewer中显示图片
   */
  reveal_in_viewer: [image: ImageType]
}

/**
 * singleton
 */
class ImageContextMenuEvent extends Emitter<Events> {
  private static instance: ImageContextMenuEvent

  private constructor() {
    super()
  }

  static getInstance() {
    if (!ImageContextMenuEvent.instance) {
      ImageContextMenuEvent.instance = new ImageContextMenuEvent()
      ImageContextMenuEvent.instance.setMaxListeners(Number.MAX_SAFE_INTEGER)
    }
    return ImageContextMenuEvent.instance
  }
}

type Ev<Events extends EventMap, EventName extends keyof Events = keyof Events> = {
  [key in EventName]?: Listener<Events[key]>
}

export default function useImageContextMenuEvent(events?: { on?: Ev<Events>; once?: Ev<Events> }) {
  const ref = useRef<ImageContextMenuEvent>()
  if (!ref.current) {
    ref.current = ImageContextMenuEvent.getInstance()
  }

  useEffect(() => {
    const registerEvent = () => {
      if (ref.current && events) {
        Object.keys(events).forEach((key) => {
          if (events[key]) {
            for (const eventName in events[key]) {
              ref.current![key](eventName as keyof Events, events[key][eventName])
            }
          }
        })
        return () => {
          Object.keys(events).forEach((key) => {
            if (events[key]) {
              for (const eventName in events[key]) {
                ref.current!.off(eventName as keyof Events, events[key][eventName])
              }
            }
          })
        }
      }
    }

    const unregister = registerEvent()
    return () => {
      unregister?.()
    }
  }, [])

  return [ref.current] as const
}
