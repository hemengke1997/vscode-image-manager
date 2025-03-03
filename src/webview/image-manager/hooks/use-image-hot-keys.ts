import { useHotkeys } from 'react-hotkeys-hook'
import { useMemoizedFn } from 'ahooks'
import { last } from 'lodash-es'
import { Key } from 'ts-key-enum'
import useImageContextMenu from '../components/context-menus/components/image-context-menu/hooks/use-image-context-menu'
import FileContext from '../contexts/file-context'
import { OS } from '../utils/device'
import useImageOperation from './use-image-operation'

export default function useImageHotKeys() {
  const { hideAll } = useImageContextMenu()
  const { allSelectedImages } = FileContext.usePicker(['allSelectedImages'])

  const { beginRenameImageProcess, beginDeleteImageProcess, beginCopyProcess, beginCutProcess, handleEscapeCutting } =
    useImageOperation()

  const handleRename = useMemoizedFn(() => {
    beginRenameImageProcess(last(allSelectedImages)!, allSelectedImages)
  })

  const handleDelete = useMemoizedFn(() => {
    beginDeleteImageProcess(allSelectedImages)
  })

  const handleCopy = useMemoizedFn(() => {
    beginCopyProcess(allSelectedImages)
  })

  const handleCut = useMemoizedFn(() => {
    beginCutProcess(allSelectedImages)
  })

  const ref = useHotkeys<HTMLDivElement>(
    [Key.F2, Key.Enter, `mod+${Key.Backspace}`, Key.Delete, `mod+c`, `mod+x`, Key.Escape],
    (e) => {
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
          handleEscapeCutting()
          return
        }
        default:
          break
      }
    },
  )

  return {
    ref,
  }
}
