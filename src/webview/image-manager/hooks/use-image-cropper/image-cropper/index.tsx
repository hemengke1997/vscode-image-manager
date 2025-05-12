import type Cropperjs from 'cropperjs'
import { memo, startTransition, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IoIosArrowDropup } from 'react-icons/io'
import { LuArrowRightLeft, LuArrowUpDown } from 'react-icons/lu'
import { RxReset } from 'react-icons/rx'
import { useMemoizedFn, useSetState, useThrottleFn, useUpdateEffect } from 'ahooks'
import { useControlledState } from 'ahooks-x'
import { type ImperativeModalProps } from 'ahooks-x/use-imperative-antd-modal'
import { App, Button, Card, Checkbox, Divider, InputNumber, Modal, Popover, Segmented, Skeleton, Space } from 'antd'
import { isNil, round } from 'es-toolkit'
import { produce } from 'immer'
import mime from 'mime/lite'
import { classNames } from 'tw-clsx'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '~/webview/vscode-api'
import { LOADING_DURATION } from '../../../utils/duration'
import ReactCropper, { type ReactCropperElement } from './components/cropper'
import { DETAIL_MAP, getAspectRatios, getViewmodes } from './utils'
import 'cropperjs/dist/cropper.css'
import styles from './index.module.css'

type Props = {
  image: ImageType | undefined
} & ImperativeModalProps

function ImageCropper(props: Props) {
  const { image, closeModal } = props || {}

  const { t, i18n } = useTranslation()
  const { message, notification } = App.useApp()
  const cropperRef = useRef<ReactCropperElement>(null)
  const _onCrop = (e: Cropperjs.CropEvent) => {
    if (allTruly(e.detail)) {
      startTransition(() => setDetails(e.detail))
    }
  }

  const onCrop = useThrottleFn(_onCrop, {
    wait: 100,
    // aviod details flash
    leading: false,
    trailing: true,
  })

  const [loading, setLoading] = useState(true)

  const allTruly = useMemoizedFn((obj: Record<string, any>) => {
    return Object.values(obj).every((item) => !isNil(item))
  })

  const [cropperOptions, setCropperOptions] = useSetState<Cropperjs.Options>({
    aspectRatio: getAspectRatios(i18n)[0].value,
    viewMode: getViewmodes(i18n)[0].value as Cropperjs.ViewMode,
    guides: true,
    highlight: false,
    background: false,
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
      cropperRef.current?.cropper?.setData({
        ...cropperRef.current?.cropper?.getData(),
        ...value,
      })
    },
  })

  const [forceRenderCropper, updateCropper] = useReducer((s: number) => s + 1, 0)
  useUpdateEffect(() => {
    if (cropperRef.current) {
      cropperRef.current?.cropper.reset()
    }
  }, [cropperRef.current])

  const previewRef = useRef<HTMLDivElement>(null)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const handlePreview = useMemoizedFn(() => {
    previewRef.current?.appendChild(cropperRef.current!.cropper?.getCroppedCanvas())
    setSaveModalOpen(true)
  })

  const [saveLoading, setSaveLoading] = useState(false)
  const handleSave = useMemoizedFn(async () => {
    setSaveLoading(true)
    try {
      if (cropperRef.current?.cropper && image) {
        const canvas = cropperRef.current?.cropper.getCroppedCanvas()
        const imageType = mime.getType(image.extname)

        const MESSAGE_KEY = 'save-cropper-image'
        message.loading({
          content: t('im.saving'),
          duration: 0,
          key: MESSAGE_KEY,
        })

        vscodeApi.postMessage(
          {
            cmd: CmdToVscode.save_cropper_image,
            data: {
              dataUrl: canvas.toDataURL(imageType || undefined),
              image,
            },
          },
          (data) => {
            if (data) {
              message.destroy(MESSAGE_KEY)

              notification.success({
                duration: LOADING_DURATION.slow,
                message: data.filename,
                description: <div className={'flex flex-col space-y-1'}>{t('im.save_success')}</div>,
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
        closeModal()
      }
    } finally {
      setSaveLoading(false)
    }
  })

  const getCropBoxCenterPoint = useMemoizedFn(() => {
    const { left, top, width, height } = cropperRef.current!.cropper!.getCropBoxData()
    return {
      x: left + width / 2,
      y: top + height / 2,
    }
  })

  const getContainerCenterPoint = useMemoizedFn(() => {
    const { width, height } = cropperRef.current!.cropper.getContainerData()
    return {
      x: width / 2,
      y: height / 2,
    }
  })

  const moveToCenter = useMemoizedFn((options?: { centerCrop?: boolean; centerX?: boolean; centerY?: boolean }) => {
    const { centerCrop = false, centerX = true, centerY = true } = options || {}
    if (centerCrop) {
      // move crop box to container center
      const { x: containerX, y: containerY } = getContainerCenterPoint()
      cropperRef.current?.cropper?.setCropBoxData({
        left: containerX - cropperRef.current?.cropper.getCropBoxData().width / 2,
        top: containerY - cropperRef.current?.cropper.getCropBoxData().height / 2,
      })
    }

    const { x: cropBoxX, y: cropBoxY } = getCropBoxCenterPoint()
    const { width, height } = cropperRef.current!.cropper.getImageData()
    const { top, left } = cropperRef.current!.cropper.getCanvasData()
    cropperRef.current?.cropper?.moveTo(centerX ? cropBoxX - width / 2 : left, centerY ? cropBoxY - height / 2 : top)
  })

  return (
    <>
      <div className={'flex items-stretch space-x-2 overflow-auto'}>
        <div className={'h-full w-[70%] flex-none'}>
          <Card>
            <ReactCropper
              src={image?.vscodePath}
              className={classNames('h-[500px] w-full max-w-full', styles.cropper, loading && 'absolute opacity-0')}
              ready={() => {
                setLoading(false)
              }}
              dragMode='move'
              ref={cropperRef}
              forceRender={forceRenderCropper}
              toggleDragModeOnDblclick={false}
              crop={onCrop.run}
              checkCrossOrigin={false}
              center
              zoomOnTouch={false}
              wheelZoomRatio={0.1}
              {...cropperOptions}
            />
            <Skeleton loading={loading} active paragraph={{ rows: 7 }} />
          </Card>
        </div>
        <div className={'flex-1'}>
          <Card
            rootClassName={'h-full'}
            styles={{
              body: {
                height: '100%',
              },
            }}
          >
            <div className={'flex h-full flex-col justify-between'}>
              <div className={'flex flex-col space-y-1'}>
                <Popover
                  trigger={['hover', 'click']}
                  content={
                    <div className={'flex w-full flex-col flex-wrap gap-x-1'}>
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
                  }
                  arrow={false}
                >
                  <Button type='default' icon={<IoIosArrowDropup />}>
                    {t('im.toggle_options')}
                  </Button>
                </Popover>

                <div className={'w-full'}>
                  <Segmented
                    value={cropperOptions.viewMode}
                    onChange={(e) => {
                      setCropperOptions({
                        viewMode: e as Cropperjs.ViewMode,
                      })
                    }}
                    options={getViewmodes(i18n).map((item) => ({
                      label: item.label,
                      value: item.value,
                    }))}
                    className={'flex'}
                    block
                    size='small'
                  ></Segmented>
                </div>

                <div className={'w-full'}>
                  <Segmented
                    value={cropperOptions.aspectRatio}
                    onChange={(e) => {
                      setCropperOptions({
                        aspectRatio: e as number,
                      })
                    }}
                    className={'flex'}
                    block
                    size='small'
                    options={getAspectRatios(i18n).map((item) => ({
                      label: item.label,
                      value: item.value,
                    }))}
                  ></Segmented>
                </div>
                <div className={'flex flex-col space-y-1'}>
                  {Object.keys(details || {}).map((key) => (
                    <InputNumber
                      addonBefore={
                        <div title={DETAIL_MAP[key].label} className={'flex w-14 items-center'}>
                          {DETAIL_MAP[key].label}
                        </div>
                      }
                      addonAfter={DETAIL_MAP[key].unit}
                      value={round(controlledDetails[key], 2)}
                      onChange={(value) =>
                        setControlledDetails(
                          produce((draft) => {
                            draft[key] = value
                          }),
                        )
                      }
                      key={key}
                    ></InputNumber>
                  ))}
                  <Divider dashed plain>
                    {t('im.operation')}
                  </Divider>
                  <div className={'flex flex-col gap-y-3'}>
                    <Space.Compact className={'flex w-full items-center'}>
                      <Button className={'flex-1'} onClick={() => moveToCenter({ centerCrop: true })}>
                        {t('im.center')}
                      </Button>
                      <Button
                        className={'flex-1'}
                        onClick={() =>
                          moveToCenter({
                            centerX: true,
                            centerY: false,
                          })
                        }
                      >
                        {t('im.center_x')}
                      </Button>
                      <Button
                        className={'flex-1'}
                        onClick={() =>
                          moveToCenter({
                            centerY: true,
                            centerX: false,
                          })
                        }
                      >
                        {t('im.center_y')}
                      </Button>
                    </Space.Compact>
                    <Space.Compact className={'flex w-full items-center'}>
                      <Button
                        className={'flex-1'}
                        onClick={() => {
                          cropperRef.current?.cropper.scaleX((controlledDetails.scaleX || 0) >= 0 ? -1 : 1)
                        }}
                        icon={<LuArrowRightLeft />}
                      >
                        {t('im.scale_x')}
                      </Button>
                      <Button
                        className={'flex-1'}
                        onClick={() => {
                          cropperRef.current?.cropper.scaleY((controlledDetails.scaleY || 0) >= 0 ? -1 : 1)
                        }}
                        icon={<LuArrowUpDown />}
                      >
                        {t('im.scale_y')}
                      </Button>
                    </Space.Compact>
                    <Space.Compact className={'flex w-full items-center'}>
                      <Button
                        className={'flex-1'}
                        icon={<RxReset />}
                        onClick={() => cropperRef.current?.cropper.reset()}
                      >
                        {t('im.reset')}
                      </Button>
                    </Space.Compact>
                  </div>
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
        destroyOnHidden
        open={saveModalOpen}
        footer={
          <div>
            <Button type='primary' onClick={handleSave} loading={saveLoading}>
              {t('im.save')}
            </Button>
          </div>
        }
        onCancel={() => {
          setSaveModalOpen(false)
        }}
        afterOpenChange={(open) => {
          if (!open && previewRef.current) {
            previewRef.current.innerHTML = ''
          }
        }}
        title={t('im.preview')}
        style={{
          top: 300,
        }}
      >
        <Card>
          <div ref={previewRef} className={classNames('flex justify-center', styles.canvas_box)}></div>
        </Card>
      </Modal>
    </>
  )
}

export default memo(ImageCropper)
