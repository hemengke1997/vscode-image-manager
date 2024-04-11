import { useControlledState, useHistoryTravel, useUpdateEffect } from '@minko-fe/react-hook'
import { Alert, App, Button, Card, ConfigProvider, type FormInstance, Modal, theme } from 'antd'
import { type ReactNode, memo, useEffect, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { Keybinding } from '../../keybinding'
import ImagePreview from '../ImagePreview'
import './index.css'

export type ImageOperatorProps = {
  images: ImageType[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ImageOperatorStaticProps = {
  title: ReactNode
  form: FormInstance
  children: ReactNode
  submitting: boolean
  onSubmittingChange?: (submitting: boolean) => void
  onImagesChange: (images: ImageType[]) => void
}

const LoadingKey = `image-operator-loading`

function ImageOperator(props: ImageOperatorProps & ImageOperatorStaticProps) {
  const { t } = useTranslation()
  const {
    open: openProp,
    images: imagesProp,
    onOpenChange,
    title,
    form,
    children,
    submitting: submittingProp,
    onSubmittingChange,
    onImagesChange,
  } = props
  const { token } = theme.useToken()
  const { message } = App.useApp()

  const [open, setOpen] = useControlledState({
    defaultValue: openProp,
    value: openProp,
    onChange: onOpenChange,
  })

  const [removed, setRemoved] = useState(false)

  const [submitting, _setSubmitting] = useControlledState({
    defaultValue: submittingProp,
    value: submittingProp,
    onChange: onSubmittingChange,
  })

  const { value: images, setValue: setImages, back, forward, backLength } = useHistoryTravel<ImageType[]>(imagesProp)

  useEffect(() => {
    if (!open) {
      message.destroy(LoadingKey)
    }
  }, [open])

  useUpdateEffect(() => {
    onImagesChange(images || [])
  }, [images])

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

  return (
    <Modal
      maskClosable={false}
      keyboard={false}
      open={open}
      onCancel={() => {
        setOpen(false)
      }}
      title={title}
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
                  sameDirImages: [],
                  sameLevelImages: [],
                  sameWorkspaceImages: [],
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
            <div className={'operator'}>{children}</div>
          </ConfigProvider>
        </Card>
        <div className={'flex w-full justify-center pt-4'}>
          <Button loading={submitting} type='primary' size='middle' onClick={() => form.submit()}>
            {t('im.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default memo(ImageOperator)
