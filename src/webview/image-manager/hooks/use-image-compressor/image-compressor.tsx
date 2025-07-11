import type { FormComponent } from '../use-operation/use-operation-form-logic'
import type { CompressionOptions } from '~/core/operator/compressor/type'
import type { ImperativeModalProps } from '~/webview/image-manager/hooks/use-imperative-antd-modal'
import { useMemoizedFn } from 'ahooks'
import { Alert, Button, Divider, Form, Input, InputNumber, Segmented, Tooltip } from 'antd'
import { intersection, mapValues, omit } from 'es-toolkit'
import { defaults } from 'es-toolkit/compat'
import { flatten as flattenObject, unflatten } from 'flat'
import { useAtomValue } from 'jotai'
import { motion } from 'motion/react'
import { memo, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { BsQuestionCircleFill } from 'react-icons/bs'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '~/webview/vscode-api'
import ImageOperator from '../../components/image-operator'
import Format from '../../components/image-operator/components/format'
import KeepOriginal from '../../components/image-operator/components/keep-original'
import SkipCompressed from '../../components/image-operator/components/skip-compressed'
import { GlobalAtoms } from '../../stores/global/global-store'
import { ANIMATION_DURATION } from '../../utils/duration'
import useImageOperation from '../use-image-operation'
import useOperationFormLogic, { OperatorMode } from '../use-operation/use-operation-form-logic'
import styles from './index.module.css'

type FormValue = CompressionOptions & {
  customResize?: number
}

type Props = {
  images: ImageType[]
  /**
   * 上层控制渲染表单字段
   */
  fields?: FormComponent<CompressionOptions>
}

function ImageCompressor(props: Props & ImperativeModalProps) {
  const { images: imagesProp, fields, closeModal } = props

  const { t } = useTranslation()

  const [form] = Form.useForm()

  const { beginCompressProcess } = useImageOperation()

  const {
    images,
    submitting,
    setSubmitting,
    onFinish: onOperationFinish,
    setImages,
  } = useOperationFormLogic<FormValue>({
    apiCommand: CmdToVscode.compress_image,
    images: imagesProp,
    onOperation: {
      onRedoClick(images) {
        beginCompressProcess(images)
      },
      onSuccess() {
        closeModal()
      },
      operationMode: OperatorMode.compression,
    },
  })

  const compressor = useAtomValue(GlobalAtoms.compressorAtom)

  const onFinish = useMemoizedFn((_value: FormValue) => {
    const value = defaults(_value, flattenObject(compressor?.option) as AnyObject)

    if (value) {
      if (Number(value.size) === 0) {
        value.size = value.customResize!
      }
      value.size = Number(value.size)
    }

    onOperationFinish(unflatten(value))
  })

  /* ------------------ 压缩配置相关 ------------------ */

  const [activeTab, setActiveTab] = useState<'not-svg' | 'svg'>('not-svg')
  const SVG_FIELDS = ['svg'] as const

  const hasSomeImageType = useMemoizedFn((type: string) => {
    return images?.some(img => img.extname === type)
  })

  const hasAllImageType = useMemoizedFn((type: string) => {
    return images?.every(img => img.extname === type)
  })

  const [svgoOpenLoading, setSvgoOpenLoading] = useState(false)

  const tabList = [
    {
      value: 'not-svg',
      label: t('im.not_svg'),
      compressorOption: flattenObject(omit(compressor!.option, SVG_FIELDS)) as AnyObject,
      componentMap: {
        // png
        'png.compressionLevel': {
          el: () =>
            hasSomeImageType('png')
              ? (
                  <Form.Item
                    label={t('im.compress_level')}
                    name='png.compressionLevel'
                    tooltip={t('im.compress_level_tip')}
                  >
                    <InputNumber min={1} max={9} step={1} />
                  </Form.Item>
                )
              : null,
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
            hasSomeImageType('gif')
              ? (
                  <Form.Item label={t('im.colors')} name='gif.colors' tooltip={t('im.colors_tip')}>
                    <InputNumber min={2} max={256} step={1} />
                  </Form.Item>
                )
              : null,
        },
        'size': {
          el: () => (
            <div className='flex items-center'>
              <Form.Item label={t('im.image_size')} name='size' className='center'>
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
                >
                </Segmented>
              </Form.Item>
              <Form.Item noStyle shouldUpdate={(p, c) => p.size !== c.size}>
                {({ getFieldValue }) =>
                  getFieldValue('size') === 0
                    ? (
                        <Form.Item
                          name='customResize'
                          className={styles.custom_resize}
                          rules={[{ required: true, message: '' }]}
                        >
                          <InputNumber
                            placeholder={t('im.scale_factor')}
                            className='h-full'
                            min={0.01}
                            max={10}
                            step={1}
                          />
                        </Form.Item>
                      )
                    : null}
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
      label: 'svg',
      compressorOption: { 'svg.tip': true },
      componentMap: {
        'svg.tip': {
          el: () => (
            <Alert
              className='mb-3'
              message={(
                <div className='flex items-center justify-center gap-x-2'>
                  <Trans
                    i18nKey='im.svgo_config'
                    components={[
                      <Button
                        key='svgo-config-button'
                        type='dashed'
                        className='mx-1 text-lg font-semibold'
                        loading={svgoOpenLoading}
                        onClick={() => {
                          setSvgoOpenLoading(true)
                          vscodeApi.postMessage({ cmd: CmdToVscode.open_svgo_config }, () => {
                            setSvgoOpenLoading(false)
                          })
                        }}
                      >
                      </Button>,
                    ]}
                  >
                  </Trans>
                  <Tooltip
                    mouseEnterDelay={0}
                    title={<Trans i18nKey='im.refer_to_svgo' components={[<a href='https://svgo.dev/' key='refer_to_svgo'></a>]}></Trans>}
                  >
                    <BsQuestionCircleFill className='cursor-pointer' />
                  </Tooltip>
                </div>
              )}
              type='info'
            />
          ),
        },
      },
      hidden: !hasSomeImageType('svg'),
    },
  ]

  useEffect(() => {
    if (!open || !images.length)
      return
    if (hasAllImageType('svg')) {
      // 全都是svg
      setActiveTab('svg')
    }
    else if (!hasSomeImageType('svg')) {
      // 全都不是svg
      setActiveTab('not-svg')
    }
  }, [images])

  const allCompressorOption = useMemo(
    () =>
      defaults(
        mapValues(fields || {}, item => item?.value),
        flattenObject(compressor?.option || {}) as AnyObject,
      ),
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

  const displayComponents = useMemo(() => {
    const active = tabList.find(item => item.value === activeTab)!
    return {
      keys: intersection(Object.keys(active.componentMap), Object.keys(active.compressorOption)),
      componentMap: active.componentMap,
    }
  }, [tabList, activeTab])

  const displayTabs = useMemo(() => tabList.filter(item => !item.hidden), [tabList])

  return (
    <ImageOperator
      images={images}
      onImagesChange={setImages}
      form={form}
      submitting={submitting}
      onSubmittingChange={setSubmitting}
    >
      <div className='flex flex-col'>
        {displayTabs.length > 1
          ? (
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                transition={{
                  duration: ANIMATION_DURATION.fast,
                }}
              >
                <div className='flex justify-center'>
                  <Segmented
                    options={displayTabs.map(t => ({
                      label: t.label,
                      value: t.value,
                    }))}
                    value={activeTab}
                    onChange={value => setActiveTab(value as typeof activeTab)}
                  >
                  </Segmented>
                </div>
                <Divider />
              </motion.div>
            )
          : null}
        <Form
          layout='horizontal'
          colon={false}
          name='image-compressor'
          initialValues={allCompressorOption}
          form={form}
          requiredMark={false}
          onFinish={onFinish}
        >
          <div className='overflow-auto'>
            {Object.keys(allComponents).map((key, index) => {
              return (
                <div key={index} hidden={!displayComponents.keys.includes(key)}>
                  {fields?.[key]?.el ? fields[key]?.el() : allComponents[key]?.el()}
                </div>
              )
            })}
          </div>

          {displayTabs.length > 1
            ? (
                <Divider plain className='!my-0'>
                  {t('im.universal')}
                </Divider>
              )
            : null}

          <SkipCompressed />

          <KeepOriginal />

          <Form.Item noStyle shouldUpdate={(p, c) => p.keepOriginal !== c.keepOriginal}>
            {({ getFieldValue }) =>
              getFieldValue('keepOriginal')
                ? (
                    <Form.Item label={t('im.suffix')} name='fileSuffix' rules={[{ required: true, message: '' }]}>
                      <Input type='text' className='w-auto' placeholder={t('im.file_suffix')} />
                    </Form.Item>
                  )
                : null}
          </Form.Item>
        </Form>
      </div>
    </ImageOperator>
  )
}

export default memo(ImageCompressor)
