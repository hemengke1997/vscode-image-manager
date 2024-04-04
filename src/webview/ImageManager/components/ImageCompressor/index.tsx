import { intersection, isEmpty, merge, omit, pick } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { App, Divider, Form, Input, InputNumber, Segmented, Tooltip } from 'antd'
import { flatten as flattenObject, unflatten } from 'flat'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { BsQuestionCircleFill } from 'react-icons/bs'
import { type CompressionOptions, type OperatorResult } from '~/core'
import { svgoPlugins } from '~/core/operator/meta'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '~/webview/vscode-api'
import GlobalContext from '../../contexts/GlobalContext'
import useOperatorModalLogic, { type FormComponent } from '../../hooks/useOperatorModalLogic'
import ImageOperator, { type ImageOperatorProps } from '../ImageOperator'
import Format from '../ImageOperator/components/Format'
import KeepOriginal from '../ImageOperator/components/KeepOriginal'
import styles from './index.module.css'

type FormValue = CompressionOptions & {
  customResize?: number
}

type ImageCompressorProps = {} & ImageOperatorProps

function ImageCompressor(props: ImageCompressorProps) {
  const { images, open, onOpenChange } = props
  const { t } = useTranslation()

  const { compressor } = GlobalContext.usePicker(['compressor'])
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const [submitting, setSubmitting] = useState(false)

  const hasSomeImageType = useMemoizedFn((type: string) => {
    return images?.some((img) => img.fileType === type)
  })

  const hasAllImageType = useMemoizedFn((type: string) => {
    return images?.every((img) => img.fileType === type)
  })

  const { handleOperateImage } = useOperatorModalLogic()

  const compressImage = useMemoizedFn((filePaths: string[], option: FormValue): Promise<OperatorResult | undefined> => {
    return new Promise((resolve) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.compress_image, data: { filePaths, option } }, (data) => {
        resolve(data)
      })
    })
  })

  const onFinish = useMemoizedFn((value: FormValue) => {
    value = merge(flattenObject(compressor?.option || {}), value)

    if (value) {
      if (Number(value.size) === 0) {
        value.size = value.customResize!
      }
      value.size = Number(value.size)
    }

    if (hasSomeImageType('svg') && value.format) {
      message.warning({
        content: t('im.svg_format_tip'),
      })
    }

    const imagesToCompress = images?.map((item) => item.path) || []

    handleOperateImage(
      (filePath?: string) => {
        return compressImage(filePath ? [filePath] : imagesToCompress, unflatten(value))
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

  /* ------------------ 压缩配置相关 ------------------ */

  const [activeTab, setActiveTab] = useState<'not-svg' | 'svg'>('not-svg')
  const SVG_FIELDS = ['svg']

  const generateSvgoFormItem = useCallback(() => {
    const svgoFormItem = {} as FormComponent<CompressionOptions>
    svgoPlugins.forEach((item) => {
      svgoFormItem[`svg.${item}`] = {
        el: () => (
          <Form.Item name={`svg.${item}`} label={item} className={'center'}>
            <Segmented
              options={[
                {
                  value: true,
                  label: t('im.yes'),
                },
                {
                  value: false,
                  label: t('im.no'),
                },
              ]}
            />
          </Form.Item>
        ),
      }
    })
    return svgoFormItem
  }, [t])

  const tabList = [
    {
      value: 'not-svg',
      label: t('im.not_svg'),
      compressorOption: flattenObject(omit(compressor?.option, SVG_FIELDS)) as AnyObject,
      componentMap: {
        // png
        'png.compressionLevel': {
          el: () =>
            hasSomeImageType('png') ? (
              <Form.Item
                label={t('im.compress_level')}
                name={'png.compressionLevel'}
                tooltip={t('im.compress_level_tip')}
              >
                <InputNumber min={1} max={9} step={1} />
              </Form.Item>
            ) : null,
        },
        'quality': {
          el: () => (
            <Form.Item label={t('im.image_quality')} name='quality' tooltip={t('im.quality_tip')}>
              <InputNumber min={20} max={100} step={10} />
            </Form.Item>
          ),
        },
        'gif.colors': {
          el: () =>
            hasSomeImageType('gif') ? (
              <Form.Item label={t('im.colors')} name='gif.colors' tooltip={t('im.colors_tip')}>
                <InputNumber min={2} max={256} step={1} />
              </Form.Item>
            ) : null,
        },
        'size': {
          el: () => (
            <div className={'flex items-center'}>
              <Form.Item label={t('im.image_size')} name='size' className={'center'}>
                <Segmented
                  options={[
                    {
                      value: 1,
                      label: '@1x',
                    },
                    {
                      value: 2,
                      label: '@2x',
                    },
                    {
                      value: 3,
                      label: '@3x',
                    },
                    {
                      value: 0,
                      label: t('im.custom'),
                    },
                  ]}
                ></Segmented>
              </Form.Item>
              <Form.Item noStyle shouldUpdate={(p, c) => p.size !== c.size}>
                {({ getFieldValue }) =>
                  getFieldValue('size') === 0 ? (
                    <Form.Item
                      name='customResize'
                      className={styles.custom_resize}
                      rules={[{ required: true, message: '' }]}
                    >
                      <InputNumber
                        placeholder={t('im.scale_factor')}
                        className={'h-full'}
                        min={0.01}
                        max={10}
                        step={1}
                      />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>
            </div>
          ),
        },
        'format': {
          el: () => {
            return <Format exts={compressor?.limit.extensions} />
          },
        },
        'skipCompressed': {
          el: () => (
            <Form.Item label={t('im.skip_compressed')} name={'skipCompressed'} className={'center'}>
              <Segmented
                options={[
                  {
                    value: true,
                    label: t('im.yes'),
                  },
                  {
                    value: false,
                    label: t('im.no'),
                  },
                ]}
              />
            </Form.Item>
          ),
        },
      } as FormComponent<CompressionOptions>,
      hidden: hasAllImageType('svg'),
    },
    {
      value: 'svg',
      label: (
        <div className={'flex items-center gap-x-2'}>
          <span>svg</span>
          <Tooltip
            title={
              <Trans i18nKey='im.refer_to_svgo'>
                <a href='https://svgo.dev/docs/preset-default/'></a>
              </Trans>
            }
          >
            <BsQuestionCircleFill />
          </Tooltip>
        </div>
      ),
      compressorOption: flattenObject(pick(compressor?.option, SVG_FIELDS)) as AnyObject,
      componentMap: generateSvgoFormItem(),
      hidden: !hasSomeImageType('svg'),
    },
  ]

  useEffect(() => {
    if (!open) return
    if (hasAllImageType('svg')) {
      // 1.如果只有svg
      setActiveTab('svg')
    } else if (!hasSomeImageType('svg')) {
      // 2.如果没有svg
      setActiveTab('not-svg')
    }
  }, [images])

  const displayComponents = useMemo(() => {
    const active = tabList.find((item) => item.value === activeTab)!
    return {
      keys: intersection(Object.keys(active.componentMap), Object.keys(active.compressorOption)),
      componentMap: active.componentMap,
    }
  }, [tabList, activeTab])

  const allCompressorOption = useMemo(() => flattenObject(compressor?.option || {}) as AnyObject, [compressor?.option])

  const allComponents = useMemo(() => {
    return tabList.reduce((prev, current) => {
      return {
        ...prev,
        ...current.componentMap,
      }
    }, {} as FormComponent<CompressionOptions>)
  }, [tabList])

  if (isEmpty(allCompressorOption)) return null

  return (
    <ImageOperator
      images={images}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      submitting={submitting}
      onSubmittingChange={setSubmitting}
    >
      <Form
        layout='horizontal'
        colon={false}
        name='image-compressor'
        initialValues={allCompressorOption}
        form={form}
        requiredMark={false}
        onFinish={onFinish}
      >
        <div className={'max-h-96 overflow-auto'}>
          {Object.keys(allComponents).map((key, index) => {
            return (
              <div key={index} hidden={!displayComponents.keys.includes(key)}>
                {allComponents[key]?.el()}
              </div>
            )
          })}
        </div>

        <Divider plain className={'!my-0'}>
          {t('im.universal')}
        </Divider>

        <KeepOriginal />

        <Form.Item noStyle shouldUpdate={(p, c) => p.keepOriginal !== c.keepOriginal}>
          {({ getFieldValue }) =>
            getFieldValue('keepOriginal') ? (
              <Form.Item label={t('im.suffix')} name={'fileSuffix'} rules={[{ required: true, message: '' }]}>
                <Input type='text' className='w-auto' placeholder={t('im.file_suffix')} />
              </Form.Item>
            ) : null
          }
        </Form.Item>
      </Form>
    </ImageOperator>
  )
}

export default memo(ImageCompressor)
