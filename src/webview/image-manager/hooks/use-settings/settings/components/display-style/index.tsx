import { useMemoizedFn } from 'ahooks'
import { Segmented } from 'antd'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useControlledState } from '~/webview/image-manager/hooks/use-controlled-state'
import Preview from '../preview'
import Compact from './images/compact.png?base64'
import Nest from './images/nest.png?base64'

export type DisplayStyleType = 'compact' | 'nested'

interface DisplayStyleProps {
  value?: DisplayStyleType
  onChange?: (style: DisplayStyleType) => void
}

function DisplayStyle(props: DisplayStyleProps) {
  const { value, onChange } = props

  const { t } = useTranslation()

  const [displayStyle, setDisplayStyle] = useControlledState({
    defaultValue: 'compact',
    value,
    onChange,
  })

  const image = useMemoizedFn(() => {
    switch (displayStyle) {
      case 'compact':
        return Compact
      case 'nested':
        return Nest
    }
  })

  return (
    <div className='flex items-center gap-x-2'>
      <Segmented
        options={[
          {
            label: t('im.compact'),
            value: 'compact',
          },
          {
            label: t('im.nested'),
            value: 'nested',
          },
        ]}
        value={displayStyle}
        onChange={(value) => {
          setDisplayStyle(value as DisplayStyleType)
        }}
      >
      </Segmented>
      <Preview image={image()} className='w-[200px]' />
    </div>
  )
}

export default memo(DisplayStyle)
