import { Badge, Checkbox, theme } from 'antd'
import { memo } from 'react'
import { type ImageStateType } from '../../contexts/ImageAnalysorContext'

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
            <Badge
              overflowCount={Number.POSITIVE_INFINITY}
              status='success'
              color={token.colorPrimary}
              count={images?.originalList.filter((t) => t.fileType === item).length}
              showZero
            />
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
