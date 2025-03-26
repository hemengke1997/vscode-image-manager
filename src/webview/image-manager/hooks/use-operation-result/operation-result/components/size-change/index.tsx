import { memo } from 'react'
import { TbArrowBigDownFilled } from 'react-icons/tb'
import { type OperatorResult } from '~/core/operator/operator'
import { formatBytes } from '~/webview/image-manager/utils'

function SizeChange(props: Pick<OperatorResult, 'inputSize' | 'outputSize'>) {
  const { inputSize, outputSize } = props
  if (inputSize && outputSize) {
    return (
      <div className={'flex flex-col items-center gap-1 text-ant-color-text'}>
        <span>{formatBytes(inputSize)}</span>
        <TbArrowBigDownFilled />
        <span>{formatBytes(outputSize)}</span>
      </div>
    )
  }
}

export default memo(SizeChange)
