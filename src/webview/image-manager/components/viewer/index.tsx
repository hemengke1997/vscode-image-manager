import { memo, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { IoMdImages } from 'react-icons/io'
import { Transition } from 'react-transition-preset'
import { styleObjectToString } from '@minko-fe/style-object-to-string'
import { useClickAway } from 'ahooks'
import { imperativeModalMap } from 'ahooks-x/use-imperative-antd-modal'
import { Card, Empty, Skeleton } from 'antd'
import { floor } from 'es-toolkit/compat'
import useImageHotKeys from '../../hooks/use-image-hot-keys'
import useImageManagerEvent, { IMEvent } from '../../hooks/use-image-manager-event'
import useSticky from '../../hooks/use-sticky'
import useWheelScaleEvent from '../../hooks/use-wheel-scale-event'
import GlobalStore from '../../stores/global-store'
import { ANIMATION_DURATION } from '../../utils/duration'
import CollapseTree from '../collapse-tree'
import ImageActions from '../image-actions'
import TitleIconUI from '../title-icon-UI'

function Viewer() {
  const { t } = useTranslation()
  const { setViewerHeaderStickyHeight, setImageWidth, setImageReveal, imageState } = GlobalStore.useStore([
    'setViewerHeaderStickyHeight',
    'setImageWidth',
    'setImageReveal',
    'imageState',
  ])

  /* ---------------- image scale --------------- */
  const [containerRef] = useWheelScaleEvent({
    setImageWidth,
    beforeScale(container) {
      return !!container?.contains(document.activeElement)
    },
    min: 30,
    max: 600,
    // 步长缩小50%，让缩放更加精确
    scaleStep: 0.5,
  })

  /* --------------- header sticky -------------- */
  const stickyRef = useRef<HTMLDivElement>(null)
  const target = useMemo(() => stickyRef.current?.querySelector('.ant-card-head') as HTMLElement, [stickyRef.current])
  useSticky({
    target,
    holder: stickyRef,
    onStickyToogle(sticky, { rawStyle }) {
      if (sticky) {
        const style =
          styleObjectToString({
            position: 'sticky',
            // 比collapse的sticky层级高就行
            zIndex: 5,
            backgroundColor: 'var(--ant-color-bg-container)',
            top: '0px',
            borderRadius: '0px',
          }) || ''
        target.setAttribute('style', rawStyle + style)
      } else {
        target.setAttribute('style', rawStyle)
      }
    },
  })
  useEffect(() => {
    if (target) {
      // Windows PC 上可能会高度计算不准确
      setViewerHeaderStickyHeight(floor(target.getBoundingClientRect().height) - 0.5)
    }
  }, [target])

  const { imageManagerEvent } = useImageManagerEvent({
    on: {
      [IMEvent.reveal_in_viewer]: (imagePaths) => {
        // 统一从这里处理reveal逻辑
        // 而不是直接调用setImageReveal
        setImageReveal(imagePaths)

        // 关闭所有命令式弹窗
        // note: 虽然 imperativeModalMap 是响应式的，但是由于react hook的组件卸载机制，导致clear的watch不一定能执行到
        // 所以还是手动关闭modal最稳健
        imperativeModalMap.forEach((modal) => modal.destroy())
      },
      [IMEvent.clear_image_reveal]: () => {
        setImageReveal([])
      },
    },
  })

  const { ref } = useImageHotKeys()

  const contentRef = useRef<HTMLDivElement>(null)
  useClickAway(
    () => {
      // 取消剪切状态
      imageManagerEvent.emit(IMEvent.clear_viewer_cut_images)
    },
    [contentRef],
    ['click'],
  )

  return (
    <div ref={containerRef} className={'space-y-4'}>
      <Card
        styles={{
          header: {
            borderBottom: 'none',
          },
          body: { padding: 0 },
        }}
        title={<TitleIconUI icon={<IoMdImages />}>{t('im.viewer')}</TitleIconUI>}
        extra={<ImageActions />}
        ref={stickyRef}
      >
        {imageState.loading ? (
          <Transition mounted={true} initial={true} duration={ANIMATION_DURATION.middle}>
            {(style) => <Skeleton style={style} className={'px-4 py-2'} active paragraph={{ rows: 4 }} />}
          </Transition>
        ) : (
          <Transition mounted={true} initial={true} duration={ANIMATION_DURATION.middle}>
            {(style) => (
              <div ref={contentRef} style={style}>
                <div className={'space-y-4'} tabIndex={-1} ref={ref}>
                  {imageState.workspaces.length ? (
                    imageState.workspaces.map((item) => <CollapseTree key={item.workspaceFolder} workspace={item} />)
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('im.no_image')} />
                  )}
                </div>
              </div>
            )}
          </Transition>
        )}
      </Card>
    </div>
  )
}

export default memo(Viewer)
