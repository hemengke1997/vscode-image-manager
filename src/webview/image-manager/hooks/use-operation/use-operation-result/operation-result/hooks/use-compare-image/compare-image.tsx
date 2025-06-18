import type { ImperativeModalProps } from '~/webview/image-manager/hooks/use-imperative-antd-modal'
import { useMemoizedFn, useSize } from 'ahooks'
import { Button, Image, Tooltip } from 'antd'
import { clamp } from 'es-toolkit'
import { memo, useState } from 'react'
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider'
import { useTranslation } from 'react-i18next'
import { TbPhotoQuestion } from 'react-icons/tb'
import useWheelScaleEvent from '~/webview/image-manager/hooks/use-wheel-scale-event'
import { classNames } from '~/webview/image-manager/utils/tw-clsx'
import { getAppRoot } from '~/webview/utils'
import styles from './index.module.css'

interface Props {
  oldImage: string
  newImage: string
  imageWidth: number
}

function CompareImage(props: ImperativeModalProps & Props) {
  const { oldImage, newImage, imageWidth, closeModal } = props

  const { t } = useTranslation()

  const { width: windowWidth = 0 } = useSize(getAppRoot()) || {}
  const max = windowWidth * 0.8
  const min = 60
  const [visible, setVisible] = useState(true)
  const [width, setWidth] = useState(() => clamp(imageWidth, min, max))

  const [ref] = useWheelScaleEvent({
    setImageWidth: setWidth,
    min,
    max,
    keyborad: false,
  })

  const imageRender = useMemoizedFn(() => {
    return (
      <>
        <div className='fixed left-1/2 top-16 z-[1] text-ant-color-text-light-solid shadow'>
          <Tooltip title={t('im.diff_tip')}>
            <Button type='text' icon={<TbPhotoQuestion className='text-3xl' />} size='middle'></Button>
          </Tooltip>
        </div>
        <div ref={ref}>
          <ReactCompareSlider
            itemOne={<ReactCompareSliderImage src={oldImage} />}
            itemTwo={<ReactCompareSliderImage src={newImage} />}
            className={classNames(
              styles.slider,
              'cursor-grab transition-[width] duration-ant-motion-duration-slow ease-ant-motion-ease-out',
            )}
            onlyHandleDraggable={true}
            style={{
              width,
            }}
          />
        </div>
      </>
    )
  })

  return (
    <Image
      preview={{
        visible,
        onVisibleChange: (value) => {
          setVisible(value)
          if (!value) {
            closeModal()
          }
        },
        keyboard: true,
        maskClosable: false,
        mask: false,
        width: '100%',
        movable: false,
        imageRender,
        toolbarRender: () => null,
      }}
      hidden={true}
    />
  )
}

export default memo(CompareImage)
