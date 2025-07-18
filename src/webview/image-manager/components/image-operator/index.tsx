import type { FormInstance } from 'antd'
import type { ReactNode } from 'react'
import { useHistoryTravel, useMemoizedFn, useUpdateEffect } from 'ahooks'
import { Alert, App, Button, Card, ConfigProvider, theme, Tooltip } from 'antd'
import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { memo, useEffect, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { VscChromeClose } from 'react-icons/vsc'
import { WorkspaceStateKey } from '~/core/persist/workspace/common'
import { useControlledState } from '~/webview/image-manager/hooks/use-controlled-state'
import useScrollRef from '~/webview/image-manager/hooks/use-scroll-ref'
import { useWorkspaceState } from '~/webview/image-manager/hooks/use-workspace-state'
import { Keybinding } from '../../keybinding'
import { VscodeAtoms } from '../../stores/vscode/vscode-store'
import ImageGroup from '../image-group'
import './index.css'

export type Props = {
  images: ImageType[]
}

type ImageOperatorStaticProps = {
  form: FormInstance
  children: ReactNode
  submitting: boolean
  onSubmittingChange?: (submitting: boolean) => void
  onImagesChange: (images: ImageType[]) => void
}

const LoadingKey = 'image-operator-loading'

function ImageOperator(props: Props & ImageOperatorStaticProps) {
  const { t } = useTranslation()
  const { images: imagesProp, form, children, submitting: submittingProp, onSubmittingChange, onImagesChange } = props
  const { token } = theme.useToken()
  const { message } = App.useApp()

  const [removed, setRemoved] = useState(false)

  const [submitting, setSubmitting] = useControlledState({
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
    'mod+z',
    () => {
      if (backLength <= 0)
        return
      back()
    },
    {
      enabled: true,
    },
  )

  useHotkeys<HTMLDivElement>(
    'mod+shift+z',
    () => {
      forward()
    },
    {
      enabled: true,
    },
  )

  const show_undo_redo_tip = useAtomValue(
    selectAtom(
      VscodeAtoms.workspaceStateAtom,
      useMemoizedFn(state => state[WorkspaceStateKey.show_undo_redo_tip]),
    ),
  )

  const [showUndoRedoTip, setShowUndoRedoTip] = useWorkspaceState(
    WorkspaceStateKey.show_undo_redo_tip,
    show_undo_redo_tip,
  )

  const { scrollRef } = useScrollRef()

  return (
    <div className='flex w-full flex-col items-center space-y-2 overflow-auto'>
      <Card className='max-h-[46vh] w-full overflow-y-auto' ref={scrollRef}>
        <div className='flex flex-col gap-y-4'>
          <ImageGroup
            images={images || []}
            lazyImageProps={{
              onRemoveClick:
                images && images?.length <= 1
                  ? undefined
                  : (image) => {
                      setImages(images?.filter(item => item.path !== image.path) || [])
                      setRemoved(true)
                    },
              lazy: {
                root: scrollRef.current!,
              },
              imageNameProps: {
                tooltipDisplayFullPath: true,
              },
            }}
          >
          </ImageGroup>
          {removed && showUndoRedoTip && (
            <Alert
              type='info'
              message={t('im.undo_redo_tip', {
                undo: Keybinding.Undo(),
                redo: Keybinding.Redo(),
              })}
              onClick={e => e.stopPropagation()}
              closable={{
                closeIcon: (
                  <Tooltip title={t('im.no_tip')}>
                    <VscChromeClose className='anticon-close text-base' />
                  </Tooltip>
                ),
              }}
              afterClose={() => {
                setShowUndoRedoTip(false)
              }}
            />
          )}
        </div>
      </Card>

      <Card className='w-full'>
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
          <div className='operator'>{children}</div>
        </ConfigProvider>
      </Card>
      <div className='flex w-full justify-center pt-4'>
        <Button
          loading={submitting}
          type='primary'
          size='middle'
          onClick={() => {
            setSubmitting(true)
            form.submit()
          }}
        >
          {t('im.confirm')}
        </Button>
      </div>
    </div>
  )
}

export default memo(ImageOperator)
