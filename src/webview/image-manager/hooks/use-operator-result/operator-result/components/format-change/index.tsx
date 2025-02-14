import { memo } from 'react'
import { Divider } from 'antd'
import { TbArrowBigDownFilled } from 'react-icons/tb'
import { type OperatorResult } from '~/core'
import { getFilenameFromPath } from '~/webview/image-manager/utils'

function FormatChange(props: Pick<OperatorResult, 'filePath' | 'outputPath'>) {
  const { filePath, outputPath } = props
  if (outputPath && outputPath !== filePath) {
    return (
      <div className={'flex flex-col items-center gap-1 text-ant-color-text'}>
        <span>{getFilenameFromPath(filePath)}</span>
        <TbArrowBigDownFilled />
        <span>{getFilenameFromPath(outputPath)}</span>
        <Divider className={'!my-0'}></Divider>
      </div>
    )
  }
}

export default memo(FormatChange)
