import { Card, Skeleton } from 'antd'
import { AnimatePresence, motion } from 'framer-motion'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { IoMdImages } from 'react-icons/io'
import GlobalContext from '../../contexts/GlobalContext'
import TreeContext from '../../contexts/TreeContext'
import useWheelScaleEvent from '../../hooks/useWheelScaleEvent'
import CollapseTree from '../CollapseTree'
import ImageActions from '../ImageActions'
import TitleIconUI from '../TitleIconUI'

function Viewer() {
  const { t } = useTranslation()
  const { imageState } = GlobalContext.usePicker(['imageState'])

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
              transition={{ duration: 0.2 }}
            >
              <Skeleton className={'px-4 py-2'} active paragraph={{ rows: 4 }} />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <div className={'space-y-4'}>
                {imageState.data.map((item, index) => (
                  <TreeContext.Provider
                    key={index}
                    value={{
                      imageList: item.imgs,
                    }}
                  >
                    <CollapseTree />
                  </TreeContext.Provider>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}

export default memo(Viewer)
