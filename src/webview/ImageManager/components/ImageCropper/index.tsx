import type Cropperjs from 'cropperjs'
import { isNil, round } from '@minko-fe/lodash-pro'
import { useControlledState, useSetState, useUpdateEffect } from '@minko-fe/react-hook'
import { isDev } from '@minko-fe/vite-config/client'
import { App, Button, Card, Checkbox, InputNumber, Modal, Radio, Skeleton } from 'antd'
import classNames from 'classnames'
import mime from 'mime/lite'
import { memo, startTransition, useEffect, useReducer, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { CmdToVscode } from '@/message/constant'
import { vscodeApi } from '@/webview/vscode-api'
import { type ImageType } from '../..'
import ReactCropper, { type ReactCropperElement } from './components/Cropper'
import { DETAIL_MAP, getAspectRatios, getViewmodes } from './utils'
import 'cropperjs/dist/cropper.css'
import styles from './index.module.css'

export type ImageCropperProps = {
  image: ImageType | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ImageCropper(props?: ImageCropperProps) {
  const { image, open: openProp, onOpenChange } = props || {}

  const [open, setOpen] = useControlledState({
    defaultValue: openProp,
    value: openProp,
    onChange: onOpenChange,
  })

  const { t, i18n } = useTranslation()
  const { message, notification } = App.useApp()
  const cropperRef = useRef<ReactCropperElement>(null)
  const cropper = cropperRef.current?.cropper
  const onCrop = (e: Cropperjs.CropEvent) => {
    if (allTruly(e.detail)) {
      startTransition(() => setDetails(e.detail))
    }
  }
  const [loading, setLoading] = useState(true)

  const allTruly = (obj: Record<string, any>) => {
    return Object.values(obj).every((item) => !isNil(item))
  }

  const [cropperOptions, setCropperOptions] = useSetState<Cropperjs.Options>({
    aspectRatio: getAspectRatios(i18n)[0].value,
    viewMode: getViewmodes(i18n)[0].value as Cropperjs.ViewMode,
    guides: false,
    highlight: false,
    background: true,
  })

  useUpdateEffect(() => {
    updateCropper()
  }, [cropperOptions])

  // from cropper
  const [details, setDetails] = useState<Partial<Cropperjs.Data>>()

  const [controlledDetails, setControlledDetails] = useControlledState<Partial<Cropperjs.Data>>({
    defaultValue: details,
    value: details,
    onChange: (value) => {
      // set cropper data
      cropper?.setData({
        ...cropper?.getData(),
        ...value,
      })
    },
  })

  const [forceRenderCropper, updateCropper] = useReducer((s: number) => s + 1, 0)
  useEffect(() => {
    // for hmr
    if (isDev()) {
      updateCropper()
    }
  }, [])

  const previewRef = useRef<HTMLDivElement>(null)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const handlePreview = () => {
    previewRef.current?.appendChild(cropper!.getCroppedCanvas())
    setSaveModalOpen(true)
  }

  const handleSave = async () => {
    if (cropper && image) {
      const canvas = cropper.getCroppedCanvas()
      const imageType = mime.getType(image.fileType)!

      const MESSAGE_KEY = 'save-cropper-image'
      message.loading({
        content: t('im.saving'),
        duration: 0,
        key: MESSAGE_KEY,
      })
      vscodeApi.postMessage(
        {
          cmd: CmdToVscode.SAVE_CROPPER_IMAGE,
          data: {
            dataUrl: canvas.toDataURL(imageType),
            image,
          },
        },
        (data) => {
          if (data) {
            message.destroy(MESSAGE_KEY)

            notification.success({
              duration: 10,
              message: t('im.save_success'),
              description: (
                <div className={'flex flex-col space-y-1'}>
                  <div className={'flex items-center'}>
                    <div>{t('im.filename')}</div>
                    <div>{data.filename}</div>
                  </div>
                  {data.fileType !== image?.fileType && (
                    <div className={'inline-flex items-center space-x-1'}>
                      <Trans
                        i18nKey='im.save_fallback'
                        values={{ currentType: image?.fileType, fallbackType: data.fileType }}
                      >
                        <div className={'text-ant-color-warning'}></div>
                        <div className={'text-ant-color-error'}></div>
                      </Trans>
                    </div>
                  )}
                </div>
              ),
            })
          } else {
            message.error({
              key: MESSAGE_KEY,
              content: t('im.save_fail'),
            })
          }
        },
      )
      setSaveModalOpen(false)
      setOpen(false)
    }
  }

  return (
    <Modal
      maskClosable={false}
      open={open}
      title={t('im.crop')}
      footer={null}
      width={'80%'}
      onCancel={() => setOpen(false)}
    >
      <div className={'flex items-stretch space-x-2 overflow-auto'}>
        <div className={'h-full w-[70%] flex-none'}>
          <Card>
            <ReactCropper
              src={image?.vscodePath}
              className={classNames('w-full max-w-full h-[30rem]', styles.cropper, loading && 'opacity-0 absolute')}
              ready={() => {
                setLoading(false)
              }}
              ref={cropperRef}
              forceRender={forceRenderCropper}
              crop={onCrop}
              checkCrossOrigin={false}
              {...cropperOptions}
            />
            <Skeleton loading={loading} active paragraph={{ rows: 7 }} />
          </Card>
        </div>
        <div className={'flex-1'}>
          <Card rootClassName={'h-full'} bodyStyle={{ height: '100%' }}>
            <div className={'flex h-full flex-col justify-between'}>
              <div className={'flex flex-col space-y-1'}>
                <div className={'flex w-full flex-wrap items-center gap-x-1'}>
                  <Checkbox
                    value={'highlight'}
                    checked={cropperOptions.highlight}
                    onChange={(e) => {
                      setCropperOptions({
                        highlight: e.target.checked,
                      })
                    }}
                  >
                    {t('im.highlight')}
                  </Checkbox>
                  <Checkbox
                    value={'guides'}
                    checked={cropperOptions.guides}
                    onChange={(e) => {
                      setCropperOptions({
                        guides: e.target.checked,
                      })
                    }}
                  >
                    {t('im.guides')}
                  </Checkbox>
                  <Checkbox
                    value={'background'}
                    checked={cropperOptions.background}
                    onChange={(e) => {
                      setCropperOptions({
                        background: e.target.checked,
                      })
                    }}
                  >
                    {t('im.background')}
                  </Checkbox>
                </div>
                <div className={'w-full'}>
                  <Radio.Group
                    value={cropperOptions.viewMode}
                    onChange={(e) => {
                      setCropperOptions({
                        viewMode: e.target.value,
                      })
                    }}
                    buttonStyle='solid'
                    className={'flex'}
                  >
                    {getViewmodes(i18n).map((item, index) => (
                      <Radio.Button className={'flex flex-1 justify-center'} key={index} value={item.value}>
                        {item.label}
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </div>

                <div className={'w-full'}>
                  <Radio.Group
                    value={cropperOptions.aspectRatio}
                    onChange={(e) => {
                      setCropperOptions({
                        aspectRatio: e.target.value,
                      })
                    }}
                    buttonStyle='solid'
                    className={'flex'}
                  >
                    {getAspectRatios(i18n).map((item, index) => (
                      <Radio.Button className={'flex flex-1 justify-center'} key={index} value={item.value}>
                        {item.label}
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </div>
                <div className={'flex flex-col space-y-1'}>
                  {Object.keys(details || {}).map((key) => (
                    <InputNumber
                      addonBefore={
                        <div title={DETAIL_MAP[key].label} className={'flex-center w-14'}>
                          {DETAIL_MAP[key].label}
                        </div>
                      }
                      addonAfter={DETAIL_MAP[key].unit}
                      value={round(controlledDetails[key], 2)}
                      onChange={(value) => setControlledDetails((t) => ({ ...t, [key]: value }))}
                      key={key}
                    ></InputNumber>
                  ))}
                </div>
              </div>
              <div className={'flex w-full justify-center'}>
                <Button type='primary' className={'w-full'} size='middle' onClick={handlePreview}>
                  {t('im.preview')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        forceRender
        destroyOnClose
        open={saveModalOpen}
        footer={
          <div>
            <Button type='primary' onClick={handleSave}>
              {t('im.save')}
            </Button>
          </div>
        }
        onCancel={() => {
          setSaveModalOpen(false)
        }}
        afterOpenChange={(open) => {
          if (!open) {
            previewRef.current!.innerHTML = ''
          }
        }}
        title={t('im.preview')}
      >
        <Card>
          <div ref={previewRef} className={classNames('flex justify-center', styles.canvas_box)}></div>
        </Card>
      </Modal>
    </Modal>
  )
}

export default memo(ImageCropper)
