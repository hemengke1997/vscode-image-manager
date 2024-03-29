import { ceil, isObject, upperCase } from '@minko-fe/lodash-pro'
import { useControlledState, useHistoryTravel, useMemoizedFn } from '@minko-fe/react-hook'
import { Alert, App, Button, Card, ConfigProvider, Divider, Form, InputNumber, Modal, Segmented, theme } from 'antd'
import { type ReactNode, memo, useEffect, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { MdDoubleArrow } from 'react-icons/md'
import { VscWarning } from 'react-icons/vsc'
import { type CompressionOptions } from '~/core/compress/Compressor'
import { CmdToVscode } from '~/message/cmd'
import logger from '~/utils/logger'
import { vscodeApi } from '~/webview/vscode-api'
import { type ImageType } from '../..'
import GlobalContext from '../../contexts/GlobalContext'
import { Keybinding } from '../../keybinding'
import { formatBytes, getFilenameFromPath } from '../../utils'
import ImagePreview from '../ImagePreview'
import styles from './index.module.css'

interface FormValue extends CompressionOptions {
  customResize?: number
}

export type ImageOperatorProps = {
  open: boolean
  images: ImageType[]
}

type ImageOperatorStaticProps = {
  onOpenChange: (open: boolean) => void
}

const LoadingKey = `compressing`

function ImageOperator(props: ImageOperatorProps & ImageOperatorStaticProps) {
  const { t } = useTranslation()
  const { open: openProp, images: imagesProp, onOpenChange } = props
  const { token } = theme.useToken()
  const { message, notification } = App.useApp()
  const { compressor } = GlobalContext.usePicker(['compressor'])

  const [open, setOpen] = useControlledState({
    defaultValue: openProp,
    value: openProp,
    onChange: onOpenChange,
  })

  const { value: images, setValue: setImages, back, forward, backLength } = useHistoryTravel<ImageType[]>()

  useEffect(() => {
    if (open && imagesProp.length) {
      // images
      setImages(imagesProp)
    } else {
      message.destroy(LoadingKey)
    }
  }, [open])

  const [form] = Form.useForm()

  const [removed, setRemoved] = useState(false)

  const compressImage = useMemoizedFn(
    (
      filePaths: string[],
      compressOptions: FormValue,
    ): Promise<
      | {
          filePath: string
          originSize?: number
          compressedSize?: number
          outputPath?: string
          error?: any
        }[]
      | undefined
    > => {
      return new Promise((resolve) => {
        vscodeApi.postMessage(
          { cmd: CmdToVscode.compress_image, data: { filePaths, option: compressOptions } },
          (data) => {
            resolve(data)
          },
        )
      })
    },
  )

  const onCompressEnd = useMemoizedFn(
    (
      result: {
        filePath: string
        originSize?: number
        compressedSize?: number
        outputPath?: string
        error?: any
      },
      options: {
        onError?: (filePath: string, error: string) => void
        onRetryClick?: (filePath: string) => void
      },
    ) => {
      const { originSize, compressedSize, filePath, outputPath, error } = result

      let filename: ReactNode = null
      if (outputPath && outputPath !== filePath) {
        // converted
        const prevFilename = getFilenameFromPath(filePath)
        const currentFilename = getFilenameFromPath(outputPath)
        filename = (
          <div className={'flex items-center space-x-2'}>
            <div>{prevFilename}</div>
            <div className={'flex items-center'}>
              <MdDoubleArrow />
            </div>
            <div>{currentFilename}</div>
          </div>
        )
      } else {
        filename = getFilenameFromPath(filePath)
      }

      if (originSize && compressedSize) {
        const percent = ceil(((originSize - compressedSize) / originSize) * 100)
        const increase = percent < 0

        notification[increase ? 'warning' : 'success']({
          duration: 10,
          message: filename,
          placement: 'topRight',
          description: (
            <div className={'flex items-center space-x-2'}>
              <div className={'flex items-center space-x-2'}>
                {increase ? (
                  <>
                    <div className='text-ant-color-warning flex items-center'>
                      <VscWarning />
                    </div>
                    <div>{t('im.size_increase')}</div>
                  </>
                ) : null}
                <div className={'text-ant-color-error font-bold'}>
                  {increase ? '+' : '-'}
                  {Math.abs(percent)}%
                </div>
              </div>
              <div className={'text-ant-color-text-secondary flex items-center space-x-1'}>
                <span>({formatBytes(originSize)}</span>
                <div className={'flex items-center'}>
                  <MdDoubleArrow />
                </div>
                <span>{formatBytes(compressedSize)})</span>
              </div>
            </div>
          ),
        })
      } else {
        const { onError, onRetryClick } = options
        const _error = isObject(error) ? JSON.stringify(error) : error

        onError?.(filePath, _error || '')
        const notificationKey = `${filename}-compress-fail`
        notification.error({
          duration: null,
          key: notificationKey,
          message: filename,
          placement: 'topLeft',
          description: (
            <div className={'flex flex-col space-y-2'}>
              <div>
                {t('im.compress_fail')}: {_error}
              </div>
              <div>
                <Button
                  onClick={() => {
                    notification.destroy(notificationKey)
                    onRetryClick?.(filePath)
                  }}
                >
                  {t('im.retry')}
                </Button>
              </div>
            </div>
          ),
        })
      }
    },
  )

  const handleCompressImage = async (
    filePaths: string[],
    compressOptions: FormValue,
    callback?: {
      onSuccess: () => void
    },
  ) => {
    setSubmitting(true)
    message.loading({
      content: t('im.compressing'),
      duration: 0,
      key: LoadingKey,
    })
    try {
      const res = await compressImage(filePaths, compressOptions)
      if (Array.isArray(res)) {
        res.forEach((item) => {
          onCompressEnd(item, {
            onRetryClick: (filePath) => {
              handleCompressImage([filePath], compressOptions, callback)
            },
          })
        })
      }
      setOpen(false)
    } catch (e) {
      logger.error(e)
    } finally {
      message.destroy(LoadingKey)
      setSubmitting(false)
    }
  }

  const [submitting, setSubmitting] = useState(false)

  const isSubmitDisabled = (formValue: FormValue) => {
    return (
      images?.some((item) => {
        return item.fileType === 'svg'
      }) &&
      !formValue.format &&
      formValue.compressionLevel
    )
  }

  const onFinish = (value: FormValue) => {
    if (value) {
      if (Number(value.size) === 0) {
        value.size = value.customResize!
      }
      value.size = Number(value.size)
    }

    let imagesToCompress = images?.map((item) => item.path) || []
    if (isSubmitDisabled(value)) {
      message.warning(t('im.svg_format_tip'))
      imagesToCompress = imagesToCompress.filter((item) => !item.endsWith('.svg'))
    }

    handleCompressImage(imagesToCompress, value)
  }

  useHotkeys<HTMLDivElement>(
    `mod+z`,
    () => {
      if (backLength <= 1) return
      back()
    },
    {
      enabled: open,
    },
  )

  useHotkeys<HTMLDivElement>(
    `mod+shift+z`,
    () => {
      forward()
    },
    {
      enabled: open,
    },
  )

  const ComponentMap = {
    // png
    compressionLevel: () => (
      <Form.Item label={t('im.compress_level')} name={'compressionLevel'} tooltip={t('im.compress_level_tip')}>
        <InputNumber min={1} max={9} step={1} />
      </Form.Item>
    ),
    // gif
    colors: () => (
      <Form.Item label={t('im.colors')} name='colors' tooltip={t('im.colors_tip')}>
        <InputNumber min={2} max={256} step={1} />
      </Form.Item>
    ),
    // except png, gif
    quality: () => (
      <Form.Item label={t('im.image_quality')} name='quality' tooltip={t('im.quality_tip')}>
        <InputNumber min={20} max={100} step={10} />
      </Form.Item>
    ),
    size: () => (
      <div className={'flex'}>
        <Form.Item label={t('im.image_size')} name='size'>
          <Segmented
            options={[
              {
                value: '1',
                label: '@1x',
              },
              {
                value: '2',
                label: '@2x',
              },
              {
                value: '3',
                label: '@3x',
              },
              {
                value: '0',
                label: t('im.custom'),
              },
            ]}
          ></Segmented>
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(p, c) => p.size !== c.size}>
          {({ getFieldValue }) =>
            getFieldValue('size') === '0' ? (
              <Form.Item name='customResize' className={styles.custom_resize} rules={[{ required: true, message: '' }]}>
                <InputNumber className={'h-full'} min={0.01} max={10} step={1} />
              </Form.Item>
            ) : null
          }
        </Form.Item>
      </div>
    ),
    format: () => {
      return (
        <Form.Item label={t('im.format')} name={'format'}>
          <Segmented
            options={[
              {
                value: '',
                label: t('im.original'),
              },
              ...(compressor?.config.exts.map((item) => ({
                value: item,
                label: upperCase(item),
              })) || []),
            ]}
          ></Segmented>
        </Form.Item>
      )
    },
    keep: () => (
      <Form.Item label={t('im.keep')} name={'keep'} tooltip={t('im.keep_origin')}>
        <Segmented
          options={[
            {
              value: 1,
              label: t('im.yes'),
            },
            {
              value: 0,
              label: t('im.no'),
            },
          ]}
        />
      </Form.Item>
    ),
    skipCompressed: () => (
      <Form.Item label={t('im.skip_compressed')} name={'skipCompressed'} className={'mb-0'}>
        <Segmented
          options={[
            {
              value: 1,
              label: t('im.yes'),
            },
            {
              value: 0,
              label: t('im.no'),
            },
          ]}
        />
      </Form.Item>
    ),
  }

  if (!compressor) return null

  return (
    <Modal
      maskClosable={false}
      keyboard={false}
      open={open}
      onCancel={() => {
        setOpen(false)
      }}
      title={t('im.image_compression')}
      footer={null}
      width={'80%'}
      destroyOnClose
    >
      <div className={'flex w-full flex-col items-center space-y-2 overflow-auto'}>
        <Card className={'max-h-[480px] w-full overflow-y-auto'}>
          <div className={'flex flex-col gap-y-4'}>
            <ImagePreview
              images={images || []}
              lazyImageProps={{
                contextMenu: {
                  operable: false,
                },
                onRemoveClick:
                  images && images?.length <= 1
                    ? undefined
                    : (image) => {
                        setImages(images?.filter((item) => item.path !== image.path) || [])
                        setRemoved(true)
                      },
              }}
            ></ImagePreview>
            {removed && (
              <Alert
                type='info'
                message={t('im.undo_redo_tip', {
                  undo: Keybinding.Undo,
                  redo: Keybinding.Redo,
                })}
                closable
              />
            )}
          </div>
        </Card>

        <Card className={'w-full'}>
          <ConfigProvider
            theme={{
              components: {
                Form: {
                  itemMarginBottom: token.marginSM,
                },
                Divider: {
                  marginLG: token.marginSM,
                },
              },
            }}
          >
            <Form
              layout='horizontal'
              colon={false}
              name='image-operator'
              initialValues={compressor?.option}
              form={form}
              requiredMark={false}
              onFinish={onFinish}
              className={styles.form}
            >
              {Object.keys(compressor?.option || []).map((key, index) => (
                <div key={index}>{ComponentMap[key]?.()}</div>
              ))}
            </Form>
            <Divider />

            <div className={'flex w-full justify-center'}>
              <Button loading={submitting} type='primary' size='middle' onClick={form.submit}>
                {t('im.confirm')}
              </Button>
            </div>
          </ConfigProvider>
        </Card>
      </div>
    </Modal>
  )
}

export default memo(ImageOperator)
