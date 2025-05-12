import { type ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { VscArrowRight } from 'react-icons/vsc'
import { useLockFn, useMemoizedFn } from 'ahooks'
import { App, Button, Divider, Space, Typography } from 'antd'
import { isString, lowerCase } from 'es-toolkit'
import { isObject, toString } from 'es-toolkit/compat'
import { ConfigKey } from '~/core/config/common'
import { type OperatorResult } from '~/core/operator/operator'
import { WorkspaceStateKey } from '~/core/persist/workspace/common'
import { CmdToVscode } from '~/message/cmd'
import { slashPath } from '~/utils'
import logger from '~/utils/logger'
import { useExtConfigState } from '~/webview/image-manager/hooks/use-ext-config-state'
import { useWorkspaceState } from '~/webview/image-manager/hooks/use-workspace-state'
import { vscodeApi } from '~/webview/vscode-api'
import FileStore, { type FileChangedResType } from '../stores/file-store'
import GlobalStore from '../stores/global-store'
import { pathUtil } from '../utils'
import { LOADING_DURATION } from '../utils/duration'
import useDeleteImage from './use-delete-image/use-delete-image'
import useImageCompressor from './use-image-compressor/use-image-compressor'
import useImageConverter from './use-image-converter/use-image-converter'
import useImageCropper from './use-image-cropper/use-image-cropper'
import useImageManagerEvent, { IMEvent } from './use-image-manager-event'
import useImageSimilarity from './use-image-similarity/use-image-similarity'
import useRenameImages from './use-rename-images/use-rename-images'
import useRename from './use-rename/use-rename'

const { Text } = Typography

const UndoMessageContent = (props: { list: string[]; title: ReactNode }) => {
  const { title, list } = props
  return (
    <div className={'flex items-center'}>
      <div>{title}</div>
      <Divider type='vertical' />
      <div className={'flex flex-col items-start gap-0.5'}>
        {list.map((t, index) => (
          <div key={index}>{t}</div>
        ))}
      </div>
    </div>
  )
}

/**
 * 图片操作相关的指令集合
 * 包括但不限于：
 * 压缩、格式转换、裁剪、查找相似图片、删除、重命名、撤销、拷贝、剪切、粘贴等
 */
function useImageOperation() {
  const { extConfig } = GlobalStore.useStore(['extConfig'])
  const { notification, message } = App.useApp()
  const { t } = useTranslation()

  const openInVscodeExplorer = useMemoizedFn((filePath: string) => {
    vscodeApi.postMessage({ cmd: CmdToVscode.open_image_in_vscode_explorer, data: { filePath } })
  })

  const openInOsExplorer = useMemoizedFn((filePath: string) => {
    vscodeApi.postMessage({ cmd: CmdToVscode.open_image_in_os_explorer, data: { filePath } })
  })

  // 复制图片 name | path | base64
  const handleCopyString = useLockFn(
    async (
      image: ImageType,
      options: {
        // 取图片的属性
        proto: 'name' | 'path' | 'relativePath'
        silent?: boolean
        callback?: (s: string) => Promise<string | undefined>
      },
    ) => {
      const { proto, silent = false, callback } = options
      const s = image[proto] || ''
      if (!s) {
        message.error(t('im.copy_fail'))
        return
      }
      const res = await callback?.(s)
      navigator.clipboard.writeText(res || s)
      !silent && message.success(t('im.copy_success'))
    },
  )

  const copyImageAsBase64 = useMemoizedFn((filePath: string): Promise<string> => {
    return new Promise((resolve) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.copy_image_as_base64, data: { filePath } }, (data) => {
        resolve(data)
      })
    })
  })

  const prettySvg = useMemoizedFn((filePath: string): Promise<boolean> => {
    return new Promise((resolve) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.prettify_svg, data: { filePath } }, (data) => {
        resolve(data)
      })
    })
  })

  const { showImageCompressor } = useImageCompressor()

  const beginCompressProcess = useMemoizedFn((images: ImageType[]) => {
    // open compress modal
    showImageCompressor({ images })
  })

  const { showImageConverter } = useImageConverter()
  const beginFormatConversionProcess = useMemoizedFn((images: ImageType[]) => {
    // open format conversion modal
    showImageConverter({
      images,
    })
  })

  const { showImageCropper } = useImageCropper()
  const cropImage = useMemoizedFn((image: ImageType) => {
    showImageCropper({ image })
  })

  const findSimilarImages = useMemoizedFn((image: ImageType, scope: ImageType[]) => {
    return new Promise<
      | string
      | Error
      | {
          image: ImageType
          distance: number
        }[]
    >((resolve) => {
      vscodeApi.postMessage(
        {
          cmd: CmdToVscode.find_similar_images,
          data: {
            image,
            scope,
          },
        },
        (res) => {
          resolve(res)
        },
      )
    })
  })

  const show_precision_tip = GlobalStore.useStore((ctx) => ctx.workspaceState.show_precision_tip)
  const [showPrecisionTip, setShowPrecisionTip] = useWorkspaceState(
    WorkspaceStateKey.show_precision_tip,
    show_precision_tip,
  )

  const { isOpened: isSimilarityOpened, showImageSimilarity } = useImageSimilarity()
  const beginFindSimilarProcess = useLockFn(async (image: ImageType, images: ImageType[]) => {
    const loadingKey = 'similarity-loading'
    const timer = setTimeout(() => {
      message.loading({
        content: t('im.wait'),
        key: loadingKey,
      })
      clearTimeout(timer)
    }, 500)
    const res = await findSimilarImages(image, images)
    clearTimeout(timer)
    message.destroy(loadingKey)
    if (isString(res)) {
      // error
      message.error(t('im.format_not_supported', { extname: image.extname }))
    } else if (res instanceof Error) {
      message.error(res.message)
    } else if (res.length) {
      showImageSimilarity({
        image,
        similarImages: res,
      })
    } else {
      notification.info({
        message: t('im.no_similar_images_title'),
        description: showPrecisionTip ? (
          <div>
            <Trans
              i18nKey='im.no_similar_images_desc'
              values={{
                option: 'image-manager.similarity.precision',
              }}
              components={[<Text code></Text>]}
            ></Trans>
          </div>
        ) : null,
        duration: LOADING_DURATION.fast,
        onClose() {
          setShowPrecisionTip(false)
        },
      })
    }
  })

  const deleteFile = useLockFn(
    (
      filePaths: string[],
      options: {
        recursive?: boolean
      },
    ) => {
      const { recursive } = options
      return new Promise<boolean>((resolve) => {
        vscodeApi.postMessage(
          { cmd: CmdToVscode.delete_file, data: { filePaths, recursive, useTrash: true } },
          (res) => {
            if (res) {
              message.success(t('im.delete_success'))
              resolve(true)
            } else {
              message.error(t('im.delete_failed'))
              resolve(false)
            }
          },
        )
      })
    },
  )

  // 删除文件
  const [confirmDelete] = useExtConfigState(ConfigKey.file_confirmDelete, extConfig.file.confirmDelete)
  const { showDeleteImage } = useDeleteImage()
  const beginDeleteProcess = useLockFn(
    async (
      files: {
        /**
         * 要删除的文件名
         */
        basename: string
        /**
         * 完整路径
         */
        path: string
      }[],
      option?: {
        /**
         * 是否递归删除
         */
        recursive?: boolean
      },
    ) => {
      const filenames = files.map((t) => t.basename).join(', ')
      let success = false

      async function handleDelete() {
        try {
          await deleteFile(
            files.map((t) => t.path),
            { recursive: option?.recursive },
          )
          success = true
        } catch {
          success = false
        }
      }

      if (confirmDelete) {
        showDeleteImage({
          onConfirm: handleDelete,
          filenames,
        })
      } else {
        await handleDelete()
      }

      return success
    },
  )

  const { imageManagerEvent } = useImageManagerEvent()
  // 删除图片
  const beginDeleteImageProcess = useMemoizedFn(async (images: ImageType[]) => {
    if (!images.length) return
    const success = await beginDeleteProcess(images.map((t) => ({ basename: t.basename, path: t.path })))
    if (success) {
      imageManagerEvent.emit(IMEvent.delete, images)
    }
  })

  // 删除目录
  const beginDeleteDirProcess = useMemoizedFn(async (dirPath: string) => {
    beginDeleteProcess([{ basename: pathUtil.getDirname(dirPath), path: dirPath }], { recursive: true })
  })

  const handleRename = useLockFn(
    async (
      files: {
        // 原路径
        source: string
        // 目标路径
        target: string
      }[],
      options: {
        // 类型：文件/目录
        type: string
        // 是否覆盖已存在的文件
        overwrite?: boolean
      },
    ) => {
      const { type, overwrite = false } = options
      return new Promise<FileChangedResType>((resolve) => {
        vscodeApi.postMessage(
          {
            cmd: CmdToVscode.rename_file,
            data: {
              files,
              overwrite,
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
                    message: t('im.file_exsits', { type }),
                  }
                } else {
                  result = {
                    ...result,
                    success: false,
                    message: t('im.rename_failed'),
                  }
                }
              } else {
                result = {
                  ...result,
                  success: true,
                  message: t('im.rename_success'),
                }
              }

              return result
            })
            resolve(formattedRes)
          },
        )
      })
    },
  )

  const { showRename } = useRename()
  const { showRenameImages } = useRenameImages()

  /**
   * 重命名图片
   * @param selectedImage 当前选中的图片
   * @param images 选中的图片列表
   */
  const beginRenameImageProcess = useMemoizedFn((selectedImage: ImageType, images: ImageType[]) => {
    if (!images.length) return
    if (images.length === 1) {
      const image = images[0]
      showRename({
        currentName: image.name,
        onSubmit: async (newName, type) => {
          return new Promise<void>((resolve, reject) => {
            const target = slashPath(`${image.absDirPath}/${newName}.${image.extname}`)
            handleRename(
              [
                {
                  source: image.path,
                  target,
                },
              ],
              {
                type,
              },
            ).then((res) => {
              if (res?.every((t) => t.success)) {
                vscodeApi.postMessage(
                  {
                    cmd: CmdToVscode.get_images,
                    data: { filePaths: [target], cwd: image.absWorkspaceFolder },
                  },
                  (newImage) => {
                    // 如果相似弹窗打开，则通知 rename 事件
                    if (isSimilarityOpened) {
                      imageManagerEvent.emit(IMEvent.rename, image, newImage[0])
                    } else {
                      // 否则，聚焦到新图片
                      beginRevealInViewer(newImage[0].path)
                    }
                  },
                )
                resolve()
              } else {
                reject(res?.[0].message)
              }
            })
          })
        },
        type: t('im.file'),
        inputProps: {
          addonAfter: `.${image.extname}`,
        },
      })
    } else {
      // 批量重命名
      showRenameImages({
        images,
        selectedImage,
        onSubmit: async (files) => {
          return new Promise<void>((resolve) => {
            handleRename(files, {
              type: t('im.file'),
            }).then((res) => {
              const failed = res?.filter((t) => !t.success)

              if (failed?.length) {
                notification.error({
                  message: t('im.rename_failed'),
                  description: notificationForRenameOrPaste(failed),
                  duration: 0,
                })
              }

              resolve()
            })
          })
        },
      })
    }
  })

  /**
   * 重命名目录
   * @param dirPath 目录路径
   */
  const beginRenameDirProcess = useMemoizedFn((dirPath: string) => {
    showRename({
      currentName: pathUtil.getDirname(dirPath),
      onSubmit: (newName, type) => {
        return new Promise<void>((resolve, reject) => {
          const target = slashPath(`${pathUtil.getAbsDir(dirPath)}/${newName}`)
          handleRename(
            [
              {
                source: dirPath,
                target,
              },
            ],
            { type },
          ).then((res) => {
            if (res?.every((t) => t.success)) {
              imageManagerEvent.emit(IMEvent.rename_directory, dirPath, target)
              resolve()
            } else {
              reject(res?.[0].message)
            }
          })
        })
      },
      type: t('im.folder'),
    })
  })

  /**
   * 在图片查看器中打开图片
   */
  const beginRevealInViewer = useMemoizedFn((imagePath: string) => {
    imageManagerEvent.emit(IMEvent.clear_viewer_selected_images)
    imageManagerEvent.emit(IMEvent.reveal_in_viewer, imagePath)
  })

  // 撤销操作
  const undo = useMemoizedFn((id: string) => {
    return new Promise<boolean>((resolve, reject) => {
      vscodeApi.postMessage(
        {
          cmd: CmdToVscode.undo_operation,
          data: {
            id,
          },
        },
        (res) => {
          if (isObject(res) && 'error' in res) {
            return reject(res.error)
          }
          return resolve(res)
        },
      )
    })
  })

  const beginUndoProcess = useMemoizedFn(async (result: OperatorResult[]) => {
    const errors: string[] = []
    const success: string[] = []
    return Promise.all(
      result.map(async (item) => {
        const { id, image } = item
        try {
          await undo(id)
          success.push(image.basename)
        } catch (e: any) {
          errors.push(toString(e))
        }
      }),
    ).finally(() => {
      if (success.length) {
        message.success(<UndoMessageContent title={t('im.undo_success')} list={success}></UndoMessageContent>, 5)
      }
      if (errors.length) {
        message.error(<UndoMessageContent title={t('im.undo_fail')} list={errors}></UndoMessageContent>, 5)
      }
    })
  })

  const { handleCopy, handlePaste, handleCut, setImageCopied, imageCopied, fileTip, setFileTip } = FileStore.useStore([
    'handleCopy',
    'handlePaste',
    'handleCut',
    'setImageCopied',
    'imageCopied',
    'fileTip',
    'setFileTip',
  ])

  const beginCopyProcess = useMemoizedFn((images: ImageType[]) => {
    if (!images.length) return
    handleCopy(images)
    logger.debug(images, '复制')
    message.success(t('im.copy_success'))
  })

  // 重命名、粘贴的提示
  const notificationForRenameOrPaste = useMemoizedFn((res: FileChangedResType) => {
    return (
      <div className={'flex flex-col gap-y-1'}>
        {res.map((item, index) => {
          const source = pathUtil.getFileName(item.source)
          const target = pathUtil.getFileName(item.target)
          return (
            <div key={index} className={'flex items-center'}>
              {item.message} <Divider type={'vertical'}></Divider>
              <div className={'flex items-center gap-x-2'}>
                {source}
                {source !== target && (
                  <>
                    <VscArrowRight />
                    {target}
                  </>
                )}
              </div>
              <Button
                className={'ml-2'}
                onClick={() => {
                  beginRevealInViewer(item.target)
                }}
              >
                {t('im.view')}
              </Button>
            </div>
          )
        })}
      </div>
    )
  })

  const beginPasteProcess = useLockFn(async (targetPath: string) => {
    const res = await handlePaste(targetPath)
    if (!res) return

    const failed = res?.filter((t) => !t.success)

    if (failed?.length && imageCopied?.list.length) {
      // 对失败的进行一波提示
      notification.error({
        message: t('im.paste_failed'),
        description: notificationForRenameOrPaste(failed),
        duration: 0,
      })
    } else if (!failed?.length) {
      // 全部成功
      message.success(t('im.paste_success'))
    }

    if (res?.filter((t) => t.success).length) {
      // 部分粘贴成功后，就清空复制的图片
      setImageCopied(undefined)
    }
  })

  const { workspaceState } = GlobalStore.useStore(['workspaceState'])
  const [showCutTip, setShowCutTip] = useWorkspaceState(WorkspaceStateKey.show_cut_tip, workspaceState.show_cut_tip)

  // 剪切图片
  const beginCutProcess = useMemoizedFn((images: ImageType[]) => {
    if (!images.length) return
    handleCut(images)
    // 根据工作区缓存和运行时缓存来判断是否需要展示剪切提示
    // 如果工作区允许且运行时允许，则展示
    if (showCutTip && fileTip.cut) {
      // 运行时只显示一次提示，多了烦躁
      setFileTip({
        cut: false,
      })

      const key = 'cut-tip'
      // 提示，可以按 exit 键取消
      message.info({
        content: (
          <Space>
            {t('im.cut_tip')}
            <Button
              onClick={() => {
                // 关闭提示，再也不显示
                setShowCutTip(false)
                message.destroy(key)
              }}
            >
              {t('im.no_tip')}
            </Button>
          </Space>
        ),
        key,
      })
    }
  })

  return {
    openInVscodeExplorer,
    openInOsExplorer,
    handleCopyString,
    copyImageAsBase64,
    beginCompressProcess,
    beginFormatConversionProcess,
    cropImage,
    prettySvg,
    beginFindSimilarProcess,
    beginDeleteImageProcess,
    beginDeleteDirProcess,
    beginRenameImageProcess,
    beginRevealInViewer,
    beginRenameDirProcess,
    beginUndoProcess,
    beginCopyProcess,
    beginPasteProcess,
    beginCutProcess,
  }
}

export default useImageOperation
