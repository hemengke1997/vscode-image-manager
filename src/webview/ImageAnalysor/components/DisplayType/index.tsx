import { Badge, Checkbox, ConfigProvider, theme } from 'antd'
import { memo } from 'react'
import { type ImageStateType } from '../../contexts/ImageAnalysorContext'
import { shouldShowImage } from '../../utils'

export type DisplayImageTypes = {
  checked: string[]
  all: string[]
}

type DisplayTypeProps = {
  images: ImageStateType
  imageTypes: DisplayImageTypes
  onImageTypeChange: (checked: string[]) => void
}

function DisplayType(props: DisplayTypeProps) {
  const { token } = theme.useToken()
  const { imageTypes, images, onImageTypeChange } = props

  const imageTypeOptions = () => {
    return imageTypes.all.map((item) => {
      return {
        label: (
          <div className={'space-x-2'}>
            <span>{item}</span>
            <ConfigProvider
              theme={{
                components: {
                  Badge: {
                    colorBgContainer: token.colorWhite,
                  },
                },
              }}
            >
              <Badge
                overflowCount={Number.POSITIVE_INFINITY}
                color={token.colorPrimary}
                count={images?.list.filter((t) => t.fileType === item && shouldShowImage(t)).length}
                showZero
              />
            </ConfigProvider>
          </div>
        ),
        value: item,
      }
    })
  }

  return (
    <Checkbox.Group
      value={imageTypes.checked}
      onChange={(checked) => onImageTypeChange(checked as string[])}
      options={imageTypeOptions()}
    ></Checkbox.Group>
  )
}

export default memo(DisplayType)
