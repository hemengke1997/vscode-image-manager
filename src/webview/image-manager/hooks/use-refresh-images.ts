import { startTransition, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounceEffect, useMemoizedFn } from 'ahooks'
import { App } from 'antd'
import { CmdToVscode } from '~/message/cmd'
import logger from '~/utils/logger'
import { vscodeApi } from '~/webview/vscode-api'
import ActionStore from '../stores/action-store'
import FileStore from '../stores/file-store'
import GlobalStore from '../stores/global-store'

export const RefreshImageDebounceTimeout = 250

/**
 * refreshTimes改变后，重新获取图片
 */
export default function useRefreshImages() {
  const { message } = App.useApp()
  const { t } = useTranslation()

  const { setImageState } = GlobalStore.useStore(['setImageState'])
  const { imageRefreshedState, notifyCollapseChange } = ActionStore.useStore([
    'imageRefreshedState',
    'notifyCollapseChange',
  ])

  const { clearNotExistImages } = FileStore.useStore(['clearNotExistImages'])

  const { refreshTimes, refreshType } = imageRefreshedState

  const getAllImagesCounter = useRef(0)

  const onRefresh = useMemoizedFn(() => {
    const isRefresh = refreshTimes && refreshType === 'refresh'
    const messageKey = 'refresh_images'
    let timer: number

    const currentCounter = ++getAllImagesCounter.current

    if (isRefresh) {
      timer = window.setTimeout(() => {
        message.loading({
          content: t('im.img_refreshing'),
          key: messageKey,
          duration: 0,
        })
        clearTimeout(timer)
      }, RefreshImageDebounceTimeout)
    }

    vscodeApi.postMessage({ cmd: CmdToVscode.get_all_images }, ({ workspaces, workspaceFolders }) => {
      if (currentCounter !== getAllImagesCounter.current) {
        return
      }
      logger.debug(CmdToVscode.get_all_images, workspaces, workspaceFolders)

      setImageState({
        workspaceFolders,
        loading: false,
        workspaces,
      })

      if (isRefresh) {
        clearTimeout(timer)
        message.destroy(messageKey)
        message.success(t('im.img_refreshed'))
      }

      startTransition(() => {
        // 通知更新collapse
        notifyCollapseChange()
        // 把选中图片中不存在的图片去掉
        clearNotExistImages(workspaces.map((item) => item.images).flat())
      })
    })
  })

  // 因为 useDebounceEffect 的 options 不能动态更改，所以需要根据情况分开处理

  // 如果是用户手动刷新，则立即刷新，且结束后不再刷新
  useDebounceEffect(
    () => {
      // 用户手动触发刷新
      if (refreshType === 'refresh') {
        onRefresh()
      }
    },
    [refreshTimes],
    {
      leading: true,
      trailing: false,
      wait: RefreshImageDebounceTimeout,
    },
  )

  // 如果是自动刷新，立即刷新
  useEffect(() => {
    if (refreshType !== 'refresh') {
      onRefresh()
    }
  }, [refreshTimes])
}
