import type { Props as ImageOperatorProps } from '../../components/image-operator'
import type { FormComponent } from '../use-operation/use-operation-form-logic'
import type { FormatConverterOptions } from '~/core/operator/format-converter'
import type { ImperativeModalProps } from '~/webview/image-manager/hooks/use-imperative-antd-modal'
import { useMemoizedFn } from 'ahooks'
import { Checkbox, Form, Tag } from 'antd'
import { mergeWith } from 'es-toolkit'
import { isArray, isEmpty, toLower } from 'es-toolkit/compat'
import { useAtomValue } from 'jotai'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { CmdToVscode } from '~/message/cmd'
import ImageOperator from '../../components/image-operator'
import Format from '../../components/image-operator/components/format'
import KeepOriginal from '../../components/image-operator/components/keep-original'
import { GlobalAtoms } from '../../stores/global/global-store'
import useImageOperation from '../use-image-operation'
import useOperationFormLogic, { OperatorMode } from '../use-operation/use-operation-form-logic'

type Props = {} & ImageOperatorProps

type FormValue = FormatConverterOptions

function ImageConverter(props: Props & ImperativeModalProps) {
  const { images: imagesProp, closeModal } = props
  const { t } = useTranslation()

  const formatConverter = useAtomValue(GlobalAtoms.formatConverterAtom)
  const [form] = Form.useForm()

  const { beginFormatConversionProcess } = useImageOperation()

  const {
    images,
    submitting,
    setSubmitting,
    onFinish: onOperationFinish,
    setImages,
  } = useOperationFormLogic<FormValue>({
    images: imagesProp,
    apiCommand: CmdToVscode.convert_image_format,
    onOperation: {
      onRedoClick(images) {
        beginFormatConversionProcess(images)
      },
      onSuccess() {
        closeModal()
      },
      operationMode: OperatorMode.conversion,
    },
  })

  const onFinish = useMemoizedFn((value: FormValue) => {
    value = mergeWith(formatConverter?.option || {}, value, (_, srcValue) => {
      if (isArray(srcValue))
        return srcValue
    })

    onOperationFinish(value)
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
                if (toLower(getFieldValue('format')) !== 'ico')
                  return null
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
                    tooltip={(
                      <div className='space-y-2'>
                        {icoTooltips.map(([size, text], index) => {
                          return (
                            <div key={index}>
                              <div className='flex flex-col'>
                                <Tag className='w-fit'>
                                  {size}
                                  x
                                  {size}
                                </Tag>
                                <div>{text}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
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
                    <Checkbox.Group options={sizes.map(size => ({ label: size, value: size }))}></Checkbox.Group>
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

  if (isEmpty(formatConverter?.option))
    return null

  return (
    <ImageOperator
      images={images}
      onImagesChange={setImages}
      form={form}
      submitting={submitting}
      onSubmittingChange={setSubmitting}
    >
      <Form
        layout='horizontal'
        colon={false}
        name='image-converter'
        initialValues={formatConverter?.option}
        form={form}
        requiredMark={false}
        onFinish={onFinish}
      >
        <div className='max-h-[600px] overflow-auto'>
          {Object.keys(tab.componentMap).map((key, index) => {
            return <div key={index}>{tab.componentMap[key]?.el()}</div>
          })}
        </div>
      </Form>
    </ImageOperator>
  )
}

export default memo(ImageConverter)
