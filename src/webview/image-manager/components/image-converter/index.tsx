import { isArray, isEmpty, mergeWith, toLower } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { Checkbox, Form, Tag } from 'antd'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type FormatConverterOptions, type OperatorResult } from '~/core'
import { CmdToVscode } from '~/message/cmd'
import { useTrackState } from '~/webview/hooks/use-track-state'
import { vscodeApi } from '~/webview/vscode-api'
import GlobalContext from '../../contexts/global-context'
import useOperatorModalLogic, { type FormComponent } from '../../hooks/use-operator-modal-logic'
import useImageContextMenuEvent from '../context-menus/components/image-context-menu/hooks/use-image-context-menu-event'
import ImageOperator, { type ImageOperatorProps } from '../image-operator'
import Format from '../image-operator/components/format'
import KeepOriginal from '../image-operator/components/keep-original'

type ImageConverterProps = {} & ImageOperatorProps

type FormValue = FormatConverterOptions

function ImageConverter(props: ImageConverterProps) {
  const { images: imagesProp, open, onOpenChange, ...rest } = props
  const { t } = useTranslation()
  const { formatConverter } = GlobalContext.usePicker(['formatConverter'])
  const [form] = Form.useForm()

  const [images, setImages] = useTrackState(imagesProp)

  const [submitting, setSubmitting] = useState(false)

  // const hasSomeImageType = useMemoizedFn((type: string) => {
  //   return images?.some((img) => img.fileType === type)
  // })

  const { handleOperateImage } = useOperatorModalLogic()

  const convertImages = useMemoizedFn((filePaths: string[], option: FormValue): Promise<OperatorResult | undefined> => {
    return new Promise((resolve) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.convert_image_format, data: { filePaths, option } }, (data) => {
        resolve(data)
      })
    })
  })

  const onFinish = useMemoizedFn((value: FormValue) => {
    value = mergeWith(formatConverter?.option || {}, value, (objValue, srcValue) => {
      if (isArray(srcValue)) return srcValue
    })

    const imagesToConvertFormat = images?.map((item) => item.path) || []

    handleOperateImage(
      (filePath?: string) => {
        return convertImages(filePath ? [filePath] : imagesToConvertFormat, value)
      },
      {
        onSuccess() {
          onOpenChange(false)
        },
        onFinal() {
          setSubmitting(false)
        },
      },
    )
  })

  useImageContextMenuEvent({
    on: {
      reveal_in_viewer: () => {
        onOpenChange(false)
      },
    },
  })

  const tab = {
    options: formatConverter?.option,
    componentMap: {
      format: {
        el: () => <Format exts={formatConverter?.limit.to} />,
      },
      icoSize: {
        el: () => {
          const sizes = [16, 32, 48, 64, 128, 256]
          return (
            <Form.Item noStyle dependencies={['format']}>
              {({ getFieldValue }) => {
                if (toLower(getFieldValue('format')) !== 'ico') return null
                const icoTooltips = [
                  [16, t('im.ico_16')],
                  [32, t('im.ico_32')],
                  [48, t('im.ico_48')],
                  [128, t('im.ico_128')],
                  [256, t('im.ico_256')],
                ]

                return (
                  <Form.Item
                    valuePropName='value'
                    label={t('im.ico_size')}
                    name='icoSize'
                    tooltip={
                      <div className={'space-y-2'}>
                        {icoTooltips.map(([size, text], index) => {
                          return (
                            <div key={index}>
                              <div className={'flex flex-col'}>
                                <Tag className={'w-fit'}>
                                  {size}x{size}
                                </Tag>
                                <div>{text}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    }
                    rules={[
                      ({ getFieldValue }) => ({
                        validator() {
                          const icoSize = getFieldValue('icoSize')
                          if (icoSize.length === 0) {
                            return Promise.reject(t('im.ico_size_empty'))
                          }
                          return Promise.resolve()
                        },
                      }),
                    ]}
                  >
                    <Checkbox.Group options={sizes.map((size) => ({ label: size, value: size }))}></Checkbox.Group>
                  </Form.Item>
                )
              }}
            </Form.Item>
          )
        },
      },
      keepOriginal: {
        el: () => <KeepOriginal />,
      },
    } as FormComponent<FormatConverterOptions>,
  }

  if (isEmpty(formatConverter?.option)) return null

  return (
    <ImageOperator
      title={t('im.convert_format')}
      images={images}
      onImagesChange={setImages}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      submitting={submitting}
      {...rest}
    >
      <Form
        layout='horizontal'
        colon={false}
        name='image-converter'
        initialValues={formatConverter.option}
        form={form}
        requiredMark={false}
        onFinish={onFinish}
      >
        <div className={'max-h-[600px] overflow-auto'}>
          {Object.keys(tab.componentMap).map((key, index) => {
            return <div key={index}>{tab.componentMap[key]?.el()}</div>
          })}
        </div>
      </Form>
    </ImageOperator>
  )
}

export default memo(ImageConverter)
