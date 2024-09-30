import { memo, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styleObjectToString from '@minko-fe/style-object-to-string'
import { useMemoizedFn } from 'ahooks'
import { Card, Empty, Skeleton } from 'antd'
import { AnimatePresence, motion } from 'framer-motion'
import { produce } from 'immer'
import { floor } from 'lodash-es'
import { IoMdImages } from 'react-icons/io'
import FilterContext from '../../contexts/filter-context'
import GlobalContext from '../../contexts/global-context'
import SettingsContext from '../../contexts/settings-context'
import TreeContext from '../../contexts/tree-context'
import useSticky from '../../hooks/use-sticky'
import useWheelScaleEvent from '../../hooks/use-wheel-scale-event'
import { ANIMATION_DURATION } from '../../utils/duration'
import CollapseTree from '../collapse-tree'
import ImageActions from '../image-actions'
import TitleIconUI from '../title-icon-UI'

function Viewer() {
  const { t } = useTranslation()
  const { imageState, setTreeData, setViewerHeaderStickyHeight } = GlobalContext.usePicker([
    'imageState',
    'setTreeData',
    'setViewerHeaderStickyHeight',
  ])

  const { imageFilter } = FilterContext.usePicker(['imageFilter'])

  const { displayGroup, displayStyle, sort } = SettingsContext.usePicker(['displayGroup', 'displayStyle', 'sort'])

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
  const [containerRef] = useWheelScaleEvent()

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
        <AnimatePresence mode='sync'>
          {imageState.loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ANIMATION_DURATION.middle }}
            >
              <Skeleton className={'px-4 py-2'} active paragraph={{ rows: 4 }} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: ANIMATION_DURATION.middle }}
            >
              <div className={'space-y-4'}>
                {imageState.data.length ? (
                  imageState.data.map((item) => (
                    <TreeContext.Provider
                      key={item.workspaceFolder}
                      value={{
                        imageList: item.images,
                        workspaceFolder: item.workspaceFolder,
                        sort,
                        imageFilter,
                        onCollectTreeData,
                      }}
                    >
                      <CollapseTree
                        multipleWorkspace={imageState.data.length > 1}
                        displayGroup={displayGroup}
                        displayStyle={displayStyle}
                      />
                    </TreeContext.Provider>
                  ))
                ) : (
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
