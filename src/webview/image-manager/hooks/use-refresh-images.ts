import { useDebounceEffect, useMemoizedFn } from '@minko-fe/react-hook'
import { App } from 'antd'
import { useTranslation } from 'react-i18next'
import { CmdToVscode } from '~/message/cmd'
import logger from '~/utils/logger'
import { vscodeApi } from '~/webview/vscode-api'
import ActionContext from '../contexts/action-context'
import GlobalContext from '../contexts/global-context'

/**
 * refreshTimes改变后，重新获取图片
 */
function useRefreshImages() {
  const { message } = App.useApp()
  const { t } = useTranslation()

  const { setImageState } = GlobalContext.usePicker(['setImageState'])
  const { imageRefreshedState } = ActionContext.usePicker(['imageRefreshedState'])

  const { refreshTimes, refreshType } = imageRefreshedState

  const onRefresh = useMemoizedFn(() => {
    const isRefresh = refreshTimes && refreshType === 'refresh'
    const messageKey = 'refresh_images'
    let timer: number
    if (isRefresh) {
      timer = window.setTimeout(() => {
        message.loading({
          content: t('im.img_refreshing'),
          key: messageKey,
          duration: 0,
        })
        clearTimeout(timer)
      }, 250)
    }

    vscodeApi.postMessage({ cmd: CmdToVscode.get_all_images }, ({ data, workspaceFolders }) => {
      logger.debug('get_all_images', data, workspaceFolders)

      setImageState({
        data,
        workspaceFolders,
        loading: false,
      })

      if (isRefresh) {
        clearTimeout(timer)
        message.destroy(messageKey)
        message.success(t('im.img_refreshed'))
      }
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
      wait: 250,
    },
  )

  // 如果是自动刷新，立即刷新且结束后也刷新
  useDebounceEffect(
    () => {
      if (refreshType !== 'refresh') {
        onRefresh()
      }
    },
    [refreshTimes],
    {
      leading: true,
      trailing: true,
      wait: 250,
    },
  )
}

export default useRefreshImages
