import { Card, Skeleton } from 'antd'
import { motion } from 'framer-motion'
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
        {imageState.loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1, delay: 0.2 }}>
            <Skeleton className={'p-4'} active paragraph={{ rows: 14 }} />
          </motion.div>
        ) : (
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
        )}
      </Card>
    </div>
  )
}

export default memo(Viewer)
