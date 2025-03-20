import { memo, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { IoMdImages } from 'react-icons/io'
import { Transition } from 'react-transition-preset'
import { styleObjectToString } from '@minko-fe/style-object-to-string'
import { useClickAway, useMemoizedFn } from 'ahooks'
import { Card, Empty, Skeleton } from 'antd'
import { floor } from 'es-toolkit/compat'
import { produce } from 'immer'
import useImageHotKeys from '../../hooks/use-image-hot-keys'
import useImageOperation from '../../hooks/use-image-operation'
import useSticky from '../../hooks/use-sticky'
import useWheelScaleEvent from '../../hooks/use-wheel-scale-event'
import FilterStore from '../../stores/filter-store'
import GlobalStore from '../../stores/global-store'
import SettingsStore from '../../stores/settings-store'
import TreeStore from '../../stores/tree-store'
import { ANIMATION_DURATION } from '../../utils/duration'
import CollapseTree from '../collapse-tree'
import ImageActions from '../image-actions'
import TitleIconUI from '../title-icon-UI'

function Viewer() {
  const { t } = useTranslation()
  const { imageState, setTreeData, setViewerHeaderStickyHeight, setImageWidth } = GlobalStore.useStore([
    'imageState',
    'setTreeData',
    'setViewerHeaderStickyHeight',
    'setImageWidth',
  ])

  const { imageFilter } = FilterStore.useStore(['imageFilter'])

  const { displayGroup, displayStyle, sort } = SettingsStore.useStore(['displayGroup', 'displayStyle', 'sort'])

  const onCollectTreeData = useMemoizedFn(
    ({ visibleList, workspaceFolder }: { visibleList: ImageType[]; workspaceFolder: string }) => {
      setTreeData(
        produce((draft) => {
          const index = draft.findIndex((t) => t.workspaceFolder === workspaceFolder)
          if (index !== -1) {
            draft[index].visibleList = [...visibleList]
          } else {
            draft.push({ workspaceFolder, visibleList })
          }
        }),
      )
    },
  )

  /* ---------------- image scale --------------- */
  const [containerRef] = useWheelScaleEvent({
    setImageWidth,
    beforeScale(container) {
      return !!container?.contains(document.activeElement)
    },
    min: 30,
    max: 600,
  })

  /* --------------- header sticky -------------- */
  const stickyRef = useRef<HTMLDivElement>(null)
  const target = useMemo(() => stickyRef.current?.querySelector('.ant-card-head') as HTMLElement, [stickyRef.current])
  useSticky({
    target,
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

  const { ref } = useImageHotKeys()

  const { handleEscapeCutting } = useImageOperation()
  const contentRef = useRef<HTMLDivElement>(null)
  useClickAway(
    () => {
      // 取消剪切状态
      handleEscapeCutting()
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
                  {imageState.data.length ? (
                    imageState.data.map((item) => (
                      <TreeStore.Provider
                        key={item.workspaceFolder}
                        imageList={item.images}
                        workspaceFolder={item.workspaceFolder}
                        workspaceId={item.absWorkspaceFolder}
                        sort={sort}
                        imageFilter={imageFilter}
                        onCollectTreeData={onCollectTreeData}
                      >
                        <CollapseTree
                          multipleWorkspace={imageState.data.length > 1}
                          displayGroup={displayGroup}
                          displayStyle={displayStyle}
                        />
                      </TreeStore.Provider>
                    ))
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
