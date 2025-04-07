import { useHotkeys } from 'react-hotkeys-hook'
import { useMemoizedFn } from 'ahooks'
import { last } from 'es-toolkit'
import { Key } from 'ts-key-enum'
import useImageContextMenu from '../components/context-menus/components/image-context-menu/hooks/use-image-context-menu'
import FileStore from '../stores/file-store'
import { OS } from '../utils/device'
import useImageManagerEvent, { IMEvent } from './use-image-manager-event'
import useImageOperation from './use-image-operation'

export default function useImageHotKeys() {
  const { hideAll } = useImageContextMenu()
  const { imageSelected } = FileStore.useStore(['imageSelected'])

  const { beginRenameImageProcess, beginDeleteImageProcess, beginCopyProcess, beginCutProcess } = useImageOperation()

  const handleRename = useMemoizedFn(() => {
    beginRenameImageProcess(last(imageSelected)!, imageSelected)
  })

  const handleDelete = useMemoizedFn(() => {
    beginDeleteImageProcess(imageSelected)
  })

  const handleCopy = useMemoizedFn(() => {
    beginCopyProcess(imageSelected)
  })

  const handleCut = useMemoizedFn(() => {
    beginCutProcess(imageSelected)
  })

  const { imageManagerEvent } = useImageManagerEvent()

  const onHotKeys = useMemoizedFn((e: KeyboardEvent) => {
    hideAll()
    switch (e.key) {
      case Key.Enter: {
        if (!OS.isWindows) {
          handleRename()
        }
        return
      }
      // windows rename key
      case Key.F2: {
        if (OS.isWindows) {
          handleRename()
        }
        return
      }
      case Key.Backspace: {
        if (!OS.isWindows) {
          handleDelete()
        }
        return
      }
      // windows delete key
      case Key.Delete: {
        if (OS.isWindows) {
          handleDelete()
        }
        return
      }
      case 'c': {
        handleCopy()
        return
      }
      case 'x': {
        handleCut()
        return
      }
      case Key.Escape: {
        imageManagerEvent.emit(IMEvent.clear_viewer_selected_images)
        imageManagerEvent.emit(IMEvent.clear_selected_images)
        imageManagerEvent.emit(IMEvent.clear_viewer_cut_images)
        return
      }
      default:
        break
    }
  })

  const ref = useHotkeys<HTMLDivElement>(
    [Key.F2, Key.Enter, `mod+${Key.Backspace}`, Key.Delete, `mod+c`, `mod+x`, Key.Escape],
    onHotKeys,
  )

  return {
    ref,
  }
}
