import { useMemoizedFn } from 'ahooks'
import { useEffect } from 'react'
import useImageManagerEvent, { IMEvent } from '../../../hooks/use-image-manager-event'

export enum PreventClickAway {
  Viewer = 'prevent-viewer-click-away',
  Other = 'prevent-other-click-away',
}

export enum ShouldClickAway {
  Viewer = 'should-click-away-viewer',
  Other = 'should-click-away-other',
}

// 全局监听点击事件，清空选中的图片
export default function useClickImageAway() {
  const { imageManagerEvent } = useImageManagerEvent()

  const parentHasClass = useMemoizedFn((el: HTMLElement, classNames: string[]) => {
    let parent = el
    while (parent) {
      if (parent.tagName === 'body') {
        return false
      }
      if (classNames.filter(Boolean).some(className => parent?.classList.contains(className))) {
        return true
      }

      parent = parent.parentElement!
    }

    return false
  })

  const clearViewerSelectedImages = useMemoizedFn(() => {
    imageManagerEvent.emit(IMEvent.clear_viewer_selected_images)
  })

  const clearOtherSelectedImages = useMemoizedFn(() => {
    imageManagerEvent.emit(IMEvent.clear_selected_images)
  })

  const hasClass = useMemoizedFn((el: HTMLElement, classNames: string[]) => {
    return classNames.some(className => el.classList.contains(className))
  })

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const targetEl = e.target as HTMLElement
      // 监听点击事件，清空viewer选中的图片

      if (!parentHasClass(targetEl, [PreventClickAway.Other]) || hasClass(targetEl, [ShouldClickAway.Other])) {
        // 清空非viewer
        clearOtherSelectedImages()
      }

      if (
        // data-clear-selected 是我希望点击就清空的元素属性
        // ant-collapse-content-box 是因为有padding，如果点到了padding部分也需要清空选中图片
        hasClass(targetEl, [ShouldClickAway.Viewer, 'ant-collapse-content-box'])
      ) {
        // 清空viewer
        return clearViewerSelectedImages()
      }

      // 如果是modal/popover等元素，则不清空viewer
      if (
        parentHasClass(targetEl, [
          PreventClickAway.Viewer,
          'ant-image-preview-root',
          'ant-image-preview-operations-wrapper',
          'ant-message',
          'ant-tooltip',
          'ant-popover',
          'ant-notification',
          'ant-modal-root',
          'ant-collapse-item',
        ])
      ) {
        // 不清空viewer
        return
      }

      // 清空viewer
      return clearViewerSelectedImages()
    }

    document.addEventListener('click', onClick)
    document.addEventListener('contextmenu', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('contextmenu', onClick)
    }
  }, [parentHasClass, hasClass, clearViewerSelectedImages, clearOtherSelectedImages])
}
