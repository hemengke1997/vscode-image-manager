import { intersection, isEmpty, mapValues, merge, omit, pick } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { Divider, Form, Input, InputNumber, Segmented, Tooltip } from 'antd'
import { flatten as flattenObject, unflatten } from 'flat'
import { motion } from 'framer-motion'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { BsQuestionCircleFill } from 'react-icons/bs'
import { type CompressionOptions, type OperatorResult } from '~/core'
import { svgoPlugins } from '~/core/operator/meta'
import { CmdToVscode } from '~/message/cmd'
import { abortPromise } from '~/utils/abort-promise'
import { vscodeApi } from '~/webview/vscode-api'
import GlobalContext from '../../contexts/global-context'
import useAbortController from '../../hooks/use-abort-controller'
import useImageOperation from '../../hooks/use-image-operation'
import useOperatorModalLogic, { type FormComponent } from '../../hooks/use-operator-modal-logic'
import { ANIMATION_DURATION } from '../../utils/duration'
import useImageContextMenuEvent from '../context-menus/components/image-context-menu/hooks/use-image-context-menu-event'
import ImageOperator, { type ImageOperatorProps } from '../image-operator'
import Format from '../image-operator/components/format'
import KeepOriginal from '../image-operator/components/keep-original'
import SkipCompressed from '../image-operator/components/skip-compressed'
import styles from './index.module.css'

type FormValue = CompressionOptions & {
  customResize?: number
}

export type ImageCompressorProps = {
  /**
   * 上层控制渲染表单字段
   */
  fields?: FormComponent<CompressionOptions>
} & ImageOperatorProps

function ImageCompressor(props: ImageCompressorProps) {
  const { images: imagesProp, open, onOpenChange, fields, ...rest } = props

  const { t } = useTranslation()

  const { compressor } = GlobalContext.usePicker(['compressor'])

  const abortController = useAbortController()

  const [form] = Form.useForm()

  const [images, setImages] = useState(imagesProp)

  const [submitting, setSubmitting] = useState(false)

  const hasSomeImageType = useMemoizedFn((type: string) => {
    return images?.some((img) => img.fileType === type)
  })

  const hasAllImageType = useMemoizedFn((type: string) => {
    return images?.every((img) => img.fileType === type)
  })

  const { beginCompressProcess } = useImageOperation()
  const { handleOperateImage } = useOperatorModalLogic({ images })

  const compressImage = useMemoizedFn((filePaths: string[], option: FormValue, abortController: AbortController) => {
    const fn = () =>
      new Promise<OperatorResult | undefined>((resolve) => {
        vscodeApi.postMessage({ cmd: CmdToVscode.compress_image, data: { filePaths, option } }, (data) => {
          resolve(data)
        })
      })

    return abortPromise(fn, {
      abortController,
      timeout: (15 + filePaths.length) * 1000,
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

    const imagesToCompress = images?.map((item) => item.path) || []

    handleOperateImage(
      () => {
        return compressImage(imagesToCompress, unflatten(value), abortController)
      },
      {
        onSuccess() {
          onOpenChange(false)
        },
        onCancel() {
          abortController.abort()
        },
        onFinal() {
          setSubmitting(false)
        },
        onRetryClick(images) {
          beginCompressProcess(images)
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
              <InputNumber min={1} max={100} step={10} />
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
            return <Format exts={compressor?.limit.to} />
          },
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
    if (!open || !images.length) return
    if (hasAllImageType('svg')) {
      // 全都是svg
      setActiveTab('svg')
    } else if (!hasSomeImageType('svg')) {
      // 全都不是svg
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

  const allCompressorOption = useMemo(
    () => merge(flattenObject(compressor?.option || {}), mapValues(fields, 'value')) as AnyObject,
    [compressor?.option, fields],
  )

  const allComponents = useMemo(() => {
    return tabList.reduce((prev, current) => {
      return {
        ...prev,
        ...current.componentMap,
      }
    }, {} as FormComponent<CompressionOptions>)
  }, [tabList])

  const displayTabs = useMemo(() => tabList.filter((item) => !item.hidden), [tabList])

  if (isEmpty(allCompressorOption)) return null

  return (
    <ImageOperator
      title={t('im.image_compression')}
      images={images}
      onImagesChange={setImages}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      submitting={submitting}
      onSubmittingChange={setSubmitting}
      {...rest}
    >
      <div className={'flex flex-col'}>
        {displayTabs.length > 1 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: ANIMATION_DURATION.fast }}
          >
            <div className={'flex justify-center'}>
              <Segmented
                options={displayTabs.map((t) => ({
                  label: t.label,
                  value: t.value,
                }))}
                value={activeTab}
                onChange={(value) => setActiveTab(value as any)}
              ></Segmented>
            </div>
            <Divider />
          </motion.div>
        ) : null}
        <Form
          layout='horizontal'
          colon={false}
          name='image-compressor'
          initialValues={allCompressorOption}
          form={form}
          requiredMark={false}
          onFinish={onFinish}
        >
          <div className={'max-h-[400px] overflow-auto'}>
            {Object.keys(allComponents).map((key, index) => {
              return (
                <div key={index} hidden={!displayComponents.keys.includes(key)}>
                  {fields?.[key]?.el ? fields[key]?.el() : allComponents[key]?.el()}
                </div>
              )
            })}
          </div>

          <Divider plain className={'!my-0'}>
            {t('im.universal')}
          </Divider>

          <SkipCompressed />

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
      </div>
    </ImageOperator>
  )
}

export default memo(ImageCompressor)
