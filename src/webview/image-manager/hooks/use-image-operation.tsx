import { isObject, isString, toString } from '@minko-fe/lodash-pro'
import { useLockFn, useMemoizedFn } from '@minko-fe/react-hook'
import { App, Button, Checkbox, Divider, Form, type InputProps, Typography } from 'antd'
import escapeStringRegexp from 'escape-string-regexp'
import { type ReactNode, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { os } from 'un-detector'
import { type OperatorResult } from '~/core'
import { ConfigKey } from '~/core/config/common'
import { WorkspaceStateKey } from '~/core/persist/workspace/common'
import { CmdToVscode } from '~/message/cmd'
import { useExtConfigState } from '~/webview/hooks/use-ext-config-state'
import { useWorkspaceState } from '~/webview/hooks/use-workspace-state'
import { vscodeApi } from '~/webview/vscode-api'
import AutoFocusInput from '../components/auto-focus-input'
import GlobalContext from '../contexts/global-context'
import { getDirFromPath, getDirnameFromPath, getFilebasename } from '../utils'
import { LOADING_DURATION } from '../utils/duration'
import { useImageCompressor } from './use-image-compressor/use-image-compressor'
import { useImageConverter } from './use-image-converter/use-image-converter'
import { useImageCropper } from './use-image-cropper/use-image-cropper'
import useImageManagerEvent from './use-image-manager-event'
import { useImageSimilarity } from './use-image-similarity/use-image-similarity'

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

function useImageOperation() {
  const { compressor, formatConverter, extConfig } = GlobalContext.usePicker([
    'compressor',
    'formatConverter',
    'extConfig',
  ])
  const { notification, message, modal } = App.useApp()
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
        proto: 'name' | 'path'
        silent?: boolean
      },
      callback?: (s: string) => Promise<string | undefined>,
    ) => {
      const { proto, silent = false } = options
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

  const noOperatorTip = useMemoizedFn(() => {
    if (!compressor || !formatConverter) {
      notification.error({
        duration: null,
        message: t('im.deps_not_found'),
        description: (
          <Button type='primary' href={import.meta.env.IM_QA_URL}>
            {t('im.view_solution')}
          </Button>
        ),
      })
      return true
    }
  })

  const [showImageCompressor] = useImageCompressor()

  const beginCompressProcess = useMemoizedFn((images: ImageType[]) => {
    const no = noOperatorTip()
    if (no) return
    // open compress modal
    showImageCompressor({ images })
  })

  const [showImageConveter] = useImageConverter()
  const beginFormatConversionProcess = useMemoizedFn((images: ImageType[]) => {
    const no = noOperatorTip()
    if (no) return
    // open format conversion modal
    showImageConveter({
      images,
    })
  })

  const [showCropperModal] = useImageCropper()
  const cropImage = useMemoizedFn((image: ImageType) => {
    showCropperModal({ image })
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

  const show_precision_tip = GlobalContext.useSelector((ctx) => ctx.workspaceState.show_precision_tip)
  const [showPrecisionTip, setShowPrecisionTip] = useWorkspaceState(
    WorkspaceStateKey.show_precision_tip,
    show_precision_tip,
  )

  const [showImageSimilarity] = useImageSimilarity()
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
      message.error(t('im.format_not_supported', { fileType: image.fileType }))
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
        vscodeApi.postMessage({ cmd: CmdToVscode.delete_file, data: { filePaths, recursive } }, (res) => {
          if (res) {
            message.success(t('im.delete_success'))
            resolve(true)
          } else {
            message.error(t('im.delete_failed'))
            resolve(false)
          }
        })
      })
    },
  )

  // 删除文件
  const [confirmDelete, setConfirmDelete] = useExtConfigState(
    ConfigKey.file_confirmDelete,
    extConfig.file.confirmDelete,
  )
  const [askDelete, setAskDelete] = useState(false)
  const beginDeleteProcess = useLockFn(
    async (
      files: {
        /**
         * 要删除的文件名
         */
        name: string
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
      const filenames = files.map((t) => t.name).join(', ')
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
        await modal.confirm({
          width: 400,
          title: t('im.delete_title', { filename: `'${filenames}'` }),
          content: (
            <div className='space-y-2'>
              <div className={'text-sm'}>
                {t('im.delete_tip', { trash: os.isMac() ? t('im.trash_macos') : t('im.trash_windows') })}
              </div>
              <Checkbox onChange={(e) => setAskDelete(e.target.checked)} defaultChecked={false}>
                {t('im.dont_ask_again')}
              </Checkbox>
            </div>
          ),
          okText: t('im.confirm'),
          cancelText: t('im.cancel'),
          centered: true,
          autoFocusButton: 'ok',
          onOk: async () => {
            if (askDelete) {
              setConfirmDelete(false)
            }
            await handleDelete()
          },
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
    const success = await beginDeleteProcess(images.map((t) => ({ name: t.name, path: t.path })))
    if (success) {
      imageManagerEvent.emit('delete', images)
    }
  })

  // 删除目录
  const beginDeleteDirProcess = useMemoizedFn(async (dirPath: string) => {
    beginDeleteProcess([{ name: getDirnameFromPath(dirPath), path: dirPath }], { recursive: true })
  })

  // 重命名
  const [renameForm] = Form.useForm()

  const renameFn = useLockFn(async (source: string, target: string) => {
    return new Promise<boolean>((resolve) => {
      vscodeApi.postMessage(
        {
          cmd: CmdToVscode.rename_file,
          data: {
            source,
            target,
          },
        },
        (res) => {
          let success = false
          if (isObject(res) && res.error_msg) {
            message.error(res.error_msg)
          } else if (res) {
            message.success(t('im.rename_success'))
            success = true
          } else {
            message.error(t('im.rename_failed'))
          }
          resolve(success)
        },
      )
    })
  })

  const beginRenameProcess = useLockFn(
    async (options: {
      /**
       * 当前名称
       */
      currentName: string
      /**
       * 完整路径
       */
      path: string
      /**
       * 表单提交成功回调
       */
      onFinish: (newName: string) => Promise<void | boolean>
      /**
       * 类型，文件 | 文件夹
       */
      type: string
      /**
       * 透传给 Input 的 props
       */
      inputProps?: InputProps
    }) => {
      const { currentName, path, onFinish, inputProps, type } = options
      const instance = modal.confirm({
        width: 400,
        content: (
          <Form
            form={renameForm}
            onFinish={async (value) => {
              const { rename } = value
              if (rename === currentName || !rename) {
                return instance.destroy()
              }
              await onFinish(rename)
              instance.destroy()
            }}
          >
            <Form.Item
              rules={[
                () => ({
                  validateTrigger: ['onSubmit'],
                  async validator(_, value) {
                    if (isString(value) && value.match(/[\/]/)) {
                      return Promise.reject(t('im.file_name_invalid', { type }))
                    }
                    if (value === currentName) {
                      return Promise.resolve()
                    }
                    const existNames = await new Promise<string[]>((resolve) => {
                      vscodeApi.postMessage(
                        {
                          cmd: CmdToVscode.get_sibling_resource,
                          data: {
                            source: path,
                          },
                        },
                        (res) => {
                          resolve(res)
                        },
                      )
                    })
                    if (existNames.some((t) => t === value)) {
                      return Promise.reject(t('im.file_exsits', { type }))
                    }
                    return Promise.resolve()
                  },
                }),
              ]}
              name='rename'
            >
              <AutoFocusInput placeholder={currentName} {...inputProps} />
            </Form.Item>
          </Form>
        ),
        okText: t('im.confirm'),
        cancelText: t('im.cancel'),
        centered: true,
        icon: null,
        async onOk() {
          renameForm.submit()
          return Promise.reject('Prevent modal from automatically closing')
        },
        afterClose() {
          renameForm.resetFields()
        },
        autoFocusButton: null, // For auto focus input
      })

      renameForm.setFieldsValue({ rename: currentName })
    },
  )

  const beginRenameImageProcess = useMemoizedFn((image: ImageType) => {
    beginRenameProcess({
      currentName: getFilebasename(image.name),
      path: image.path,
      onFinish: (newName) => {
        return new Promise<void>((resolve) => {
          renameFn(image.path, `${getDirFromPath(image.path)}/${newName}.${image.fileType}`).then((res) => {
            if (res) {
              const currentNameEscaped = escapeStringRegexp(getFilebasename(image.name))
              const fileTypeEscaped = escapeStringRegexp(image.fileType)
              const newPath = image.path.replace(
                new RegExp(`(${currentNameEscaped})\\.${fileTypeEscaped}$`),
                `${newName}.${image.fileType}`,
              )
              vscodeApi.postMessage(
                {
                  cmd: CmdToVscode.get_one_image,
                  data: { filePath: newPath, cwd: image.absWorkspaceFolder },
                },
                (newImage) => {
                  beginRevealInViewer(newImage)

                  imageManagerEvent.emit('rename', image, newImage)
                },
              )
            }
            resolve()
          })
        })
      },
      type: t('im.file'),
      inputProps: {
        addonAfter: `.${image.fileType}`,
      },
    })
  })

  /**
   * 重命名目录
   * @param dirPath 目录路径
   */
  const beginRenameDirProcess = useMemoizedFn((dirPath: string) => {
    beginRenameProcess({
      currentName: getDirnameFromPath(dirPath),
      path: dirPath,
      onFinish: (newName) => {
        return new Promise<boolean>((resolve) => {
          renameFn(dirPath, `${getDirFromPath(dirPath)}/${newName}`).then((res) => {
            if (res) {
              const newDirPath = `${getDirFromPath(dirPath)}/${newName}`
              imageManagerEvent.emit('rename_directory', dirPath, newDirPath)
            }
            resolve(res!)
          })
        })
      },
      type: t('im.folder'),
    })
  })

  const beginRevealInViewer = useMemoizedFn((image: ImageType) => {
    imageManagerEvent.emit('reveal_in_viewer', image)
    setTimeout(() => {
      new Promise<boolean>((resolve) => {
        vscodeApi.postMessage(
          {
            cmd: CmdToVscode.reveal_image_in_viewer,
            data: { filePath: image.path },
          },
          (res) => {
            resolve(res)
          },
        )
      })
    })
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
          success.push(image.name)
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
  }
}

export default useImageOperation
