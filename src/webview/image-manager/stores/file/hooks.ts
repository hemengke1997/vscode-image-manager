import { useMemoizedFn } from 'ahooks'
import { lowerCase } from 'es-toolkit'
import { produce } from 'immer'
import { useAtom, useSetAtom } from 'jotai'
import { useTranslation } from 'react-i18next'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '~/webview/vscode-api'
import useImageManagerEvent, { IMEvent } from '../../hooks/use-image-manager-event'
import { CopyType, FileAtoms } from './file-store'

export type FileChangedResType = { success: boolean, message: string, target: string, source: string }[]

/**
 * viewer中 文件复制、粘贴、剪切等操作
 */
export function useFileActions() {
  const { t } = useTranslation()

  const setImageSelectedMap = useSetAtom(FileAtoms.imageSelectedMap)
  const [imageCopied, setImageCopied] = useAtom(FileAtoms.imageCopied)

  // 清除选中图片中已经不存在的图片
  const clearNotExistImages = useMemoizedFn((images: ImageType[]) => {
    const imagePathsSet = new Set(images.map(image => image.path))

    setImageSelectedMap(
      produce((draft) => {
        let hasChanges = false

        for (const [key, value] of draft.entries()) {
          const filteredValue = value.filter(item => imagePathsSet.has(item.path))
          if (filteredValue.length !== value.length) {
            draft.set(key, filteredValue)
            hasChanges = true
          }
        }

        // 只有在有变化时才更新
        if (!hasChanges) {
          return draft
        }
      }),
    )
  })

  useImageManagerEvent({
    on: {
      [IMEvent.clear_viewer_selected_images]: () => {
        setImageSelectedMap(new Map())
      },
      [IMEvent.clear_viewer_cut_images]: () => {
        // 取消剪切态
        setImageCopied((t) => {
          if (t?.type === 'move' && t.list.length) {
            return undefined
          }
          return t
        })
      },
    },
  })

  /* -- handle方法不要直接使用，通过 useImageOperation 使用 -- */
  /* ------ 因为Context中访问不到antd的上下文，不方便做逻辑处理 ----- */

  // 复制图片
  const handleCopy = useMemoizedFn((images: ImageType[]) => {
    setImageCopied({
      list: images,
      type: CopyType.COPY,
    })
  })

  // 剪切图片
  const handleCut = useMemoizedFn((images: ImageType[]) => {
    setImageCopied({
      list: images,
      type: CopyType.MOVE,
    })
  })

  // 粘贴图片
  const handlePaste = useMemoizedFn((targetPath: string) => {
    if (!imageCopied?.list.length)
      return
    const images = imageCopied.list.map(image => image.path)

    return new Promise<FileChangedResType>((resolve) => {
      vscodeApi.postMessage(
        {
          cmd: CmdToVscode.copy_or_move_file_to,
          data: {
            source: images,
            target: targetPath,
            type: imageCopied.type,
          },
        },
        (res) => {
          const formattedRes = res.map((item) => {
            let result = {
              success: true,
              message: '',
              target: item.target,
              source: item.source,
            }
            if (item.status === 'rejected') {
              if (lowerCase(item.reason.code).includes('exists')) {
                // 文件已存在
                result = {
                  ...result,
                  success: false,
                  message: t('im.file_exsits', { type: t('im.file') }),
                }
              }
              else {
                result = {
                  ...result,
                  success: false,
                  message: item.reason.message,
                }
              }
            }

            return result
          })
          resolve(formattedRes)
        },
      )
    })
  })

  return {
    clearNotExistImages,
    handleCopy,
    handleCut,
    handlePaste,
  }
}
