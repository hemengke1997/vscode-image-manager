import { useClickAway } from 'ahooks'
import { Card, Empty, Skeleton } from 'antd'
import { floor } from 'es-toolkit/compat'
import { useAtomValue, useSetAtom } from 'jotai'
import { AnimatePresence, motion } from 'motion/react'
import { memo, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { IoMdImages } from 'react-icons/io'
import { imperativeModalMap } from '~/webview/image-manager/hooks/use-imperative-antd-modal'
import useImageHotKeys from '../../hooks/use-image-hot-keys'
import useImageManagerEvent, { IMEvent } from '../../hooks/use-image-manager-event'
import useSticky from '../../hooks/use-sticky'
import useWheelScaleEvent from '../../hooks/use-wheel-scale-event'
import { GlobalAtoms } from '../../stores/global/global-store'
import { useImageWidth } from '../../stores/global/hooks'
import { imageStateAtom } from '../../stores/image/image-store'
import { ANIMATION_DURATION } from '../../utils/duration'
import CollapseTree from '../collapse-tree'
import ImageActions from '../image-actions'
import TitleIconUI from './components/title-icon-UI'
import useClickImageAway from './hooks/use-click-image-away'

function Viewer() {
  const { t } = useTranslation()

  const setViewerHeaderStickyHeight = useSetAtom(GlobalAtoms.viewerHeaderStickyHeightAtom)
  const setImageReveal = useSetAtom(GlobalAtoms.imageRevealAtom)
  const [, setImageWidth] = useImageWidth()

  const imageState = useAtomValue(imageStateAtom)

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
        const style = [
          'position: sticky',
          'z-index: 5', // 比 collapse 的 sticky 层级高就行
          'background-color: var(--ant-color-bg-container)',
          'top: 0px',
          'border-radius: 0px',
        ].join('; ')

        target.setAttribute('style', rawStyle + style)
      }
      else {
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
      [IMEvent.reveal_in_viewer]: (imagePath) => {
        // 统一从这里处理reveal逻辑
        // 而不是直接调用setImageReveal
        setImageReveal(imagePath)

        // 关闭所有命令式弹窗
        imperativeModalMap.forEach(modal => modal.destroy())
      },
      [IMEvent.clear_image_reveal]: () => {
        setImageReveal(undefined)
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

  useClickImageAway()

  const motions = useMemo(() => ({
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
    },
    exit: {
      opacity: 0,
    },
    transition: {
      duration: ANIMATION_DURATION.middle,
    },
  }), [])

  return (
    <div ref={containerRef} className='space-y-4'>
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
        <AnimatePresence>
          {imageState.loading
            ? (
                <motion.div {...motions}>
                  <Skeleton className='px-4 py-2' active paragraph={{ rows: 4 }} />
                </motion.div>
              )
            : (
                <motion.div
                  ref={contentRef}
                  {...motions}
                >
                  <div className='space-y-4' tabIndex={-1} ref={ref}>
                    {imageState.workspaces.length
                      ? (
                          imageState.workspaces.map(item => <CollapseTree key={item.workspaceFolder} workspace={item} />)
                        )
                      : (
                          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('im.no_image')} />
                        )}
                  </div>
                </motion.div>
              )}
        </AnimatePresence>
      </Card>
    </div>
  )
}

export default memo(Viewer)
