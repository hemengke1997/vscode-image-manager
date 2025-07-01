import type { ReactNode } from 'react'
import type { EnableCollapseContextMenuType } from '../../../../../context-menus/components/collapse-context-menu'
import { memo } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { Key } from 'ts-key-enum'
import useImageManagerEvent, { IMEvent } from '~/webview/image-manager/hooks/use-image-manager-event'
import useImageOperation from '~/webview/image-manager/hooks/use-image-operation'
import { OS } from '~/webview/image-manager/utils/device'
import { classNames } from '~/webview/image-manager/utils/tw-clsx'
import useCollapseContextMenu from '../../../../../context-menus/components/collapse-context-menu/hooks/use-collapse-context-menu'

type SingleLabelProps = {
  children: ReactNode
  contextMenu?: EnableCollapseContextMenuType
  dirPath: string
  index: number
  onContextMenu: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => void
  onClick: (() => void) | undefined
  className?: string
}

function SingleLabel(props: SingleLabelProps) {
  const { children, contextMenu, dirPath, index, onContextMenu, onClick, className } = props
  const { beginRenameDirProcess, beginDeleteDirProcess, beginPasteProcess } = useImageOperation()

  const { hideAll } = useCollapseContextMenu()

  const hotkeys = [
    {
      enable: contextMenu?.rename_directory,
      keys: [Key.F2, Key.Enter],
    },
    {
      enable: contextMenu?.delete_directory,
      keys: [`mod+${Key.Backspace}`, Key.Delete],
    },
  ]

  // collapse上label的快捷键
  const keybindRef = useHotkeys<HTMLDivElement>(
    [
      ...hotkeys
        .filter(t => t.enable)
        .map(t => t.keys)
        .flat(),
      'mod+v',
    ],
    (e) => {
      switch (e.key) {
        case Key.F2: {
          if (OS.isWindows) {
            hideAll()
            beginRenameDirProcess(dirPath)
          }
          return
        }
        case Key.Enter: {
          if (!OS.isWindows) {
            hideAll()
            beginRenameDirProcess(dirPath)
          }
          return
        }
        case Key.Backspace: {
          if (!OS.isWindows) {
            beginDeleteDirProcess(dirPath)
          }
          return
        }
        case Key.Delete: {
          if (OS.isWindows) {
            beginDeleteDirProcess(dirPath)
          }
          return
        }
        case 'v': {
          beginPasteProcess(dirPath)
        }
      }
    },
    {
      description: dirPath,
      enabled(e) {
        if ((e.target as HTMLDivElement).getAttribute('data-dir-path') === dirPath) {
          return true
        }
        return false
      },
    },
  )

  const { imageManagerEvent } = useImageManagerEvent()

  return (
    <div
      onContextMenu={e => onContextMenu(e, index)}
      className={classNames('relative w-full transition-all', className)}
      onClick={onClick}
    >
      <div
        ref={keybindRef}
        data-dir-path={dirPath}
        className={classNames(
          'inline-flex',
          !!contextMenu
          && 'cursor-pointer transition-all hover:text-ant-color-primary-text-hover focus:text-ant-color-primary-text-hover focus:underline',
        )}
        tabIndex={-1}
        onClick={(e) => {
          if (contextMenu) {
            // 防止触发父元素的打开collapse事件
            e.stopPropagation()
            // 清除图片选中状态
            imageManagerEvent.emit(IMEvent.clear_viewer_selected_images)
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default memo(SingleLabel)
