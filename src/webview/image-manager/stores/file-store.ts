import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMemoizedFn, useSetState } from 'ahooks'
import { createStore } from 'context-state'
import { produce } from 'immer'
import { lowerCase } from 'lodash-es'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '~/webview/vscode-api'

export type FileChangedResType = { success: boolean; message: string; target: string; source: string }[]

export enum CopyType {
  // 复制
  COPY = 'copy',
  // 剪切
  MOVE = 'move',
}

/**
 * 文件复制、粘贴、剪切上下文
 */
function useFileStore() {
  const { t } = useTranslation()
  const [selectedImageMap, setSelectedImageMap] = useState<Map<string, ImageType[]>>(new Map())

  // 所有选中的图片
  const allSelectedImages = useMemo(() => {
    return Array.from(selectedImageMap.values()).flat()
  }, [selectedImageMap])

  const [imageCopied, setImageCopied] = useState<{
    list: ImageType[]
    type: CopyType
  }>()

  // 清空选中图片
  const clearSelectedImages = useMemoizedFn(() => {
    setSelectedImageMap(new Map())
  })

  // 清除选中图片中已经不存在的图片
  const clearNotExistImages = useMemoizedFn((images: ImageType[]) => {
    const imagePathsSet = new Set(images.map((image) => image.path))

    setSelectedImageMap(
      produce((draft) => {
        let hasChanges = false

        for (const [key, value] of draft.entries()) {
          const filteredValue = value.filter((item) => imagePathsSet.has(item.path))
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

  // 全局的文件操作相关提示
  const [fileTip, setFileTip] = useSetState<{
    // 剪切提示
    cut: boolean
  }>({ cut: false })

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
    if (!imageCopied?.list.length) return
    const images = imageCopied.list.map((image) => image.path)

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
              if (lowerCase(item.reason['code']).includes('exists')) {
                // 文件已存在
                result = {
                  ...result,
                  success: false,
                  message: t('im.file_exsits', { type: t('im.file') }),
                }
              } else {
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
    selectedImageMap,
    setSelectedImageMap,
    clearSelectedImages,
    clearNotExistImages,
    allSelectedImages,
    imageCopied,
    setImageCopied,
    handleCopy,
    handleCut,
    handlePaste,
    fileTip,
    setFileTip,
  }
}

const FileStore = createStore(useFileStore)

export default FileStore
