import { Card, Empty, Skeleton } from 'antd'
import { AnimatePresence, motion } from 'framer-motion'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { IoMdImages } from 'react-icons/io'
import GlobalContext from '../../contexts/GlobalContext'
import SettingsContext from '../../contexts/SettingsContext'
import TreeContext from '../../contexts/TreeContext'
import useWheelScaleEvent from '../../hooks/useWheelScaleEvent'
import { ANIMATION_DURATION } from '../../utils/duration'
import CollapseTree from '../CollapseTree'
import ImageActions from '../ImageActions'
import TitleIconUI from '../TitleIconUI'

function Viewer() {
  const { t } = useTranslation()
  const { imageState, imageFilter } = GlobalContext.usePicker(['imageState', 'imageFilter'])

  const { displayGroup, displayStyle, sort, displayImageTypes } = SettingsContext.usePicker([
    'displayGroup',
    'displayStyle',
    'sort',
    'displayImageTypes',
  ])

  /* ---------------- image scale --------------- */
  const [containerRef] = useWheelScaleEvent()

  return (
    <div ref={containerRef} className={'space-y-4'}>
      <Card
        styles={{
          header: { borderBottom: 'none' },
          body: { padding: 0 },
        }}
        title={<TitleIconUI icon={<IoMdImages />}>{t('im.images')}</TitleIconUI>}
        extra={<ImageActions />}
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
                        displayImageTypes,
                        imageFilter,
                      }}
                    >
                      <CollapseTree displayGroup={displayGroup} displayStyle={displayStyle} />
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
