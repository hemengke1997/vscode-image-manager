import { isObject, isString } from '@minko-fe/lodash-pro'
import { useLockFn, useMemoizedFn } from '@minko-fe/react-hook'
import { App, Button, Checkbox, Form, Input, type InputRef, Typography } from 'antd'
import { useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { os } from 'un-detector'
import { ConfigKey } from '~/core/config/common'
import { CmdToVscode } from '~/message/cmd'
import { useExtConfigState } from '~/webview/hooks/useExtConfigState'
import { vscodeApi } from '~/webview/vscode-api'
import CroppoerContext from '../contexts/CropperContext'
import GlobalContext from '../contexts/GlobalContext'
import OperatorContext from '../contexts/OperatorContext'
import { getDirFromPath, getFilebasename } from '../utils'
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
      images,
    })
  })

  const beginFormatConversionProcess = useMemoizedFn((images: ImageType[]) => {
    const no = noOperatorTip()
    if (no) return
    // open format conversion modal
    setFormatConverterModal({
      open: true,
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

  const deleteImage = useLockFn((image: ImageType) => {
    return new Promise<boolean>((resolve) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.delete_file, data: { filePath: image.path } }, (res) => {
        if (res) {
          message.success(t('im.delete_success'))
          resolve(true)
        } else {
          message.error(t('im.delete_failed'))
          resolve(false)
        }
      })
    })
  })

  const { extConfig } = GlobalContext.usePicker(['extConfig'])
  const [confirmDelete, setConfirmDelete] = useExtConfigState(
    ConfigKey.file_confirmDelete,
    extConfig.file.confirmDelete,
  )
  const [askDelete, setAskDelete] = useState(false)
  const beginDeleteProcess = useLockFn(async (image: ImageType) => {
    if (confirmDelete) {
      modal.confirm({
        width: 300,
        title: t('im.delete_title', { filename: `'${image.name}'` }),
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
            await deleteImage(image)
            return true
          } catch {
            return false
          }
        },
      })
    } else {
      try {
        await deleteImage(image)
        return true
      } catch {
        return false
      }
    }
  })

  const [renameForm] = Form.useForm()
  const renameInputRef = useRef<InputRef>(null)
  const renameFn = useLockFn(async (image: ImageType, target: string) => {
    return new Promise((resolve) => {
      vscodeApi.postMessage(
        {
          cmd: CmdToVscode.rename_file,
          data: {
            source: image.path,
            target: `${getDirFromPath(image.path)}/${target}.${image.fileType}`,
          },
        },
        (res) => {
          if (isObject(res) && res.error_msg) {
            message.error(res.error_msg)
          } else if (res) {
            message.success(t('im.rename_success'))
          } else {
            message.error(t('im.rename_failed'))
          }
          resolve(true)
        },
      )
    })
  })
  const beginRenameProcess = useLockFn(async (image: ImageType, sameDirImages: ImageType[]) => {
    const currentName = getFilebasename(image.name)
    const instance = modal.confirm({
      width: 300,
      content: (
        <Form
          form={renameForm}
          onFinish={(value) => {
            const { rename } = value
            if (rename === currentName) {
              return instance.destroy()
            }
            renameFn(image, rename).then(() => {
              instance.destroy()
            })
          }}
        >
          <Form.Item
            rules={[
              { required: true, message: '' },
              () => ({
                validateTrigger: ['onSubmit'],
                validator(_, value) {
                  if (isString(value) && (value.startsWith('/') || value.endsWith('.'))) {
                    return Promise.reject(t('im.file_name_invalid'))
                  }
                  if (value === currentName) {
                    return Promise.resolve()
                  }
                  if (sameDirImages.some((t) => getFilebasename(t.name) === value)) {
                    return Promise.reject(t('im.file_exsits'))
                  }
                  return Promise.resolve()
                },
              }),
            ]}
            name='rename'
          >
            <Input ref={renameInputRef} placeholder={currentName} addonAfter={`.${image.fileType}`}></Input>
          </Form.Item>
        </Form>
      ),
      okText: t('im.confirm'),
      okButtonProps: {
        htmlType: 'submit',
      },
      cancelText: t('im.cancel'),
      centered: true,
      icon: null,
      async onOk() {
        await renameForm.validateFields()
        renameForm.submit()
      },
      afterClose() {
        renameForm.resetFields()
      },
    })

    renameForm.setFieldsValue({ rename: currentName })

    const timer = setTimeout(() => {
      renameInputRef.current?.focus({ cursor: 'end' })
      clearTimeout(timer)
    }, 1)
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
    beginDeleteProcess,
    beginRenameProcess,
  }
}

export default useImageOperation
