import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '~/webview/vscode-api'

if (import.meta.hot) {
  function avoidEmptyWebview() {
    vscodeApi.postMessage({ cmd: CmdToVscode.reload_webview })
    throw new Error('prevent vite invoke `window.location.reload`')
  }

  // aviod empty webview on full reload
  import.meta.hot.on('vite:beforeFullReload', () => {
    avoidEmptyWebview()
  })
  import.meta.hot.on('vite:ws:disconnect', () => {
    avoidEmptyWebview()
  })
}
