import { memo, type ReactNode } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { Key } from 'ts-key-enum'
import { classNames } from 'tw-clsx'
import useImageOperation from '~/webview/image-manager/hooks/use-image-operation'
import useCollapseContextMenu from '../../../context-menus/components/collapse-context-menu/hooks/use-collapse-context-menu'

type SingleLabelProps = {
  children: ReactNode
  contextMenu: boolean
  dirPath: string
  index: number
  onContextMenu: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => void
  onClick: () => void
}

function SingleLabel(props: SingleLabelProps) {
  const { children, contextMenu, dirPath, index, onContextMenu, onClick } = props
  const { beginRenameDirProcess, beginDeleteDirProcess } = useImageOperation()

  const { hideAll } = useCollapseContextMenu()

  const keybindRef = useHotkeys<HTMLDivElement>(
    [Key.Enter, `mod+${Key.Backspace}`, Key.Delete],
    (e) => {
      if (contextMenu) {
        switch (e.key) {
          case Key.Enter: {
            hideAll()
            beginRenameDirProcess(dirPath)
            return
          }
          // mac delete key
          case Key.Backspace: {
            beginDeleteDirProcess(dirPath)
            return
          }
          // windows delete key
          case Key.Delete: {
            beginDeleteDirProcess(dirPath)
            return
          }
          default:
            break
        }
      }
    },
    {
      description: dirPath,
      enabled(e) {
        if ((e.target as HTMLDivElement).dataset.dir_path === dirPath) {
          return true
        }
        return false
      },
    },
  )

  return (
    <div className={'w-full flex-1'}>
      <div
        onContextMenu={(e) => onContextMenu(e, index)}
        className={classNames('relative w-full cursor-pointer transition-all')}
        onClick={onClick}
      >
        <div
          ref={keybindRef}
          data-dir_path={dirPath}
          tabIndex={-1}
          className={
            'hover:text-ant-color-primary-text-hover focus:text-ant-color-primary-text-hover inline-flex transition-all focus:underline'
          }
          onClick={(e) => {
            // 防止触发父元素的打开collapse事件
            e.stopPropagation()
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default memo(SingleLabel)
