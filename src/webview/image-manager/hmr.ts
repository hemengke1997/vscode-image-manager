import { CmdToVscode } from '~/message/cmd'
import logger from '~/utils/logger'
import { vscodeApi } from '~/webview/vscode-api'

if (import.meta.hot) {
  function avoidEmptyWebview() {
    vscodeApi.postMessage({ cmd: CmdToVscode.reload_webview })

    throw new Error('prevent vite invoke `window.location.reload`')
  }

  // 避免在vite服务器reload时webview空白
  import.meta.hot.on('vite:beforeFullReload', () => {
    logger.debug('vite:beforeFullReload')
    avoidEmptyWebview()
  })
  import.meta.hot.on('vite:ws:disconnect', () => {
    logger.debug('vite:ws:disconnect')
    avoidEmptyWebview()
  })
  import.meta.hot.on('vite:error', () => {
    logger.debug('vite:error')
    avoidEmptyWebview()
  })
}
