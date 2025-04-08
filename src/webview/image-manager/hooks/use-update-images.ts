import { startTransition } from 'react'
import { useMemoizedFn } from 'ahooks'
import { CmdToVscode } from '~/message/cmd'
import { type FullUpdate, type PatchUpdate } from '~/message/webview-message-factory'
import logger from '~/utils/logger'
import { vscodeApi } from '~/webview/vscode-api'
import ImageStore, { WorkspaceUpdate } from '../stores/image-store'

/**
 * 更新图片
 */
export default function useUpdateImages() {
  const { dispatchImageState } = ImageStore.useStore(['dispatchImageState'])

  /**
   * 全量更新
   */
  const fullUpdate = useMemoizedFn((data: FullUpdate) => {
    startTransition(() => {
      dispatchImageState(data)
    })
  })

  /**
   * 增量更新
   */
  const patchUpdate = useMemoizedFn((data: PatchUpdate) => {
    startTransition(() => {
      dispatchImageState(data)
    })
  })

  /**
   * imageState更新后，把部分属性恢复到默认值
   */
  const resetPartialState = useMemoizedFn(() => {
    startTransition(() => {
      dispatchImageState({
        updateType: WorkspaceUpdate.reset,
      })
    })
  })

  /**
   * 获取所有图片
   */
  const getAllImages = useMemoizedFn(async () => {
    logger.time(CmdToVscode.get_all_images_from_cwds)
    return new Promise<boolean>((resolve) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.get_all_images_from_cwds }, () => {
        resolve(true)
        logger.timeEnd(CmdToVscode.get_all_images_from_cwds)
      })
    })
  })

  return {
    fullUpdate,
    patchUpdate,
    getAllImages,
    resetPartialState,
  }
}
