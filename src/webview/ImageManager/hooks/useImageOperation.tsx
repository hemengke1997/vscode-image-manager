import { isObject, isString } from '@minko-fe/lodash-pro'
import { useLockFn, useMemoizedFn } from '@minko-fe/react-hook'
import { App, Button, Checkbox, Form, Input, type InputProps, type InputRef, Typography } from 'antd'
import escapeStringRegexp from 'escape-string-regexp'
import { useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { os } from 'un-detector'
import { ConfigKey } from '~/core/config/common'
import { CmdToVscode } from '~/message/cmd'
import { useExtConfigState } from '~/webview/hooks/useExtConfigState'
import { vscodeApi } from '~/webview/vscode-api'
import useImageContextMenuEvent from '../components/ContextMenus/components/ImageContextMenu/hooks/useImageContextMenuEvent'
import CroppoerContext from '../contexts/CropperContext'
import GlobalContext from '../contexts/GlobalContext'
import OperatorContext from '../contexts/OperatorContext'
import { getDirFromPath, getDirnameFromPath, getFilebasename } from '../utils'
import { LOADING_DURATION } from '../utils/duration'

const { Text } = Typography

function useImageOperation() {
  const { compressor, formatConverter } = GlobalContext.usePicker(['compressor', 'formatConverter'])
  const { notification, message, modal } = App.useApp()
  const { t } = useTranslation()

  const { setCompressorModal, setFormatConverterModal, setSimilarityModal } = OperatorContext.usePicker([
    'setCompressorModal',
    'setFormatConverterModal',
    'setSimilarityModal',
  ])

  const openInVscodeExplorer = useMemoizedFn((filePath: string) => {
    vscodeApi.postMessage({ cmd: CmdToVscode.open_image_in_vscode_explorer, data: { filePath } })
  })

  const openInOsExplorer = useMemoizedFn((filePath: string) => {
    vscodeApi.postMessage({ cmd: CmdToVscode.open_image_in_os_explorer, data: { filePath } })
  })

  const copyImageAsBase64 = useMemoizedFn((filePath: string): Promise<string> => {
    return new Promise((resolve) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.copy_image_as_base64, data: { filePath } }, (data) => {
        resolve(data)
      })
    })
  })

  const prettySvg = useMemoizedFn((filePath: string): Promise<boolean> => {
    return new Promise((resolve) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.pretty_svg, data: { filePath } }, (data) => {
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

  const beginCompressProcess = useMemoizedFn((images: ImageType[]) => {
    const no = noOperatorTip()
    if (no) return
    // open compress modal
    setCompressorModal({
      open: true,
      closed: false,
      images,
    })
  })

  const beginFormatConversionProcess = useMemoizedFn((images: ImageType[]) => {
    const no = noOperatorTip()
    if (no) return
    // open format conversion modal
    setFormatConverterModal({
      open: true,
      closed: false,
      images,
    })
  })

  const { setCropperProps } = CroppoerContext.usePicker(['setCropperProps'])
  const cropImage = useMemoizedFn((image: ImageType) => {
    setCropperProps({ open: true, image })
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

  const beginFindSimilarProcess = useLockFn(async (image: ImageType, images: ImageType[]) => {
    const loadingKey = 'similarity-loading'
    const timer = setTimeout(() => {
      message.loading({
        content: t('im.wait'),
        key: loadingKey,
      })
      clearTimeout(timer)
    }, 200)
    const res = await findSimilarImages(image, images)
    clearTimeout(timer)
    message.destroy(loadingKey)
    if (isString(res)) {
      // error
      message.error(t('im.format_not_supported', { fileType: image.fileType }))
    } else if (res instanceof Error) {
      message.error(res.message)
    } else if (res.length) {
      setSimilarityModal({
        open: true,
        closed: false,
        image,
        similarImages: res,
      })
    } else {
      notification.info({
        message: t('im.no_similar_images_title'),
        description: (
          <div>
            <Trans
              i18nKey='im.no_similar_images_desc'
              values={{
                option: 'image-manager.similarity.precision',
              }}
            >
              <Text code></Text>
            </Trans>
          </div>
        ),
        duration: LOADING_DURATION.fast,
      })
    }
  })

  const deleteFile = useLockFn(
    (
      filePath: string,
      options: {
        recursive?: boolean
      },
    ) => {
      const { recursive } = options
      return new Promise<boolean>((resolve) => {
        vscodeApi.postMessage({ cmd: CmdToVscode.delete_file, data: { filePath, recursive } }, (res) => {
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
  const { extConfig } = GlobalContext.usePicker(['extConfig'])
  const [confirmDelete, setConfirmDelete] = useExtConfigState(
    ConfigKey.file_confirmDelete,
    extConfig.file.confirmDelete,
  )
  const [askDelete, setAskDelete] = useState(false)
  const beginDeleteProcess = useLockFn(
    async (options: {
      /**
       * 要删除的文件名
       */
      name: string
      /**
       * 完整路径
       */
      path: string
      /**
       * 是否递归删除
       */
      recursive?: boolean
    }) => {
      const { name, path, recursive } = options
      let success = false
      if (confirmDelete) {
        await modal.confirm({
          width: 300,
          title: t('im.delete_title', { filename: `'${name}'` }),
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
          onOk: async () => {
            if (askDelete) {
              setConfirmDelete(false)
            }
            try {
              await deleteFile(path, { recursive })
              success = true
            } catch {
              success = false
            }
          },
        })
      } else {
        try {
          await deleteFile(path, { recursive })
          success = true
        } catch {
          success = false
        }
      }
      return success
    },
  )

  const [imageContextMenuEvent] = useImageContextMenuEvent()
  // 删除图片
  const beginDeleteImageProcess = useMemoizedFn(async (image: ImageType) => {
    const success = await beginDeleteProcess({ name: getFilebasename(image.name), path: image.path })
    if (success) {
      imageContextMenuEvent.emit('delete', image)
    }
  })

  // 删除目录
  const beginDeleteDirProcess = useMemoizedFn(async (dirPath: string) => {
    beginDeleteProcess({ name: getDirnameFromPath(dirPath), path: dirPath, recursive: true })
  })

  // 重命名
  const [renameForm] = Form.useForm()
  const renameInputRef = useRef<InputRef>(null)

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
        width: 300,
        content: (
          <Form
            form={renameForm}
            onFinish={async (value) => {
              const { rename } = value
              if (rename === currentName) {
                return instance.destroy()
              }
              await onFinish(rename)
              instance.destroy()
            }}
          >
            <Form.Item
              rules={[
                { required: true, message: '' },
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
              <Input ref={renameInputRef} placeholder={currentName} {...inputProps}></Input>
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
      })

      renameForm.setFieldsValue({ rename: currentName })

      requestIdleCallback(() => {
        renameInputRef.current?.focus({ cursor: 'end' })
      })
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
                (res) => {
                  imageContextMenuEvent.emit('rename', image, res)
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

  const beginRenameDirProcess = useMemoizedFn((dirPath: string) => {
    beginRenameProcess({
      currentName: getDirnameFromPath(dirPath),
      path: dirPath,
      onFinish: (newName) => {
        return new Promise<boolean>((resolve) => {
          renameFn(dirPath, `${getDirFromPath(dirPath)}/${newName}`).then((res) => {
            resolve(res!)
          })
        })
      },
      type: t('im.folder'),
    })
  })

  const beginRevealInViewer = useMemoizedFn((image: ImageType) => {
    imageContextMenuEvent.emit('reveal_in_viewer', image)
    requestIdleCallback(() => {
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

  return {
    openInVscodeExplorer,
    openInOsExplorer,
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
  }
}

export default useImageOperation
