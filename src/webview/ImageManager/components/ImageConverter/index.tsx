import { isEmpty, merge } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { Form } from 'antd'
import { flatten as flattenObject, unflatten } from 'flat'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type FormatConverterOptions, type OperatorResult } from '~/core'
import { CmdToVscode } from '~/message/cmd'
import { useTrackState } from '~/webview/hooks/useTrackState'
import { vscodeApi } from '~/webview/vscode-api'
import GlobalContext from '../../contexts/GlobalContext'
import useOperatorModalLogic, { type FormComponent } from '../../hooks/useOperatorModalLogic'
import useImageContextMenuEvent from '../ContextMenus/components/ImageContextMenu/hooks/useImageContextMenuEvent'
import ImageOperator, { type ImageOperatorProps } from '../ImageOperator'
import Format from '../ImageOperator/components/Format'
import KeepOriginal from '../ImageOperator/components/KeepOriginal'

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
    value = merge(flattenObject(formatConverter?.option || {}), value)

    const imagesToConvertFormat = images?.map((item) => item.path) || []

    handleOperateImage(
      (filePath?: string) => {
        return convertImages(filePath ? [filePath] : imagesToConvertFormat, unflatten(value))
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
        el: () => <Format exts={formatConverter?.limit.extensions} />,
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