import { CmdToVscode } from '../../message/constant'
import { vscodeApi } from '../vscode-api'

if (import.meta.hot) {
  // aviod empty webview on full reload
  import.meta.hot.on('vite:beforeFullReload', () => {
    vscodeApi.postMessage({ cmd: CmdToVscode.RELOAD_WEBVIEW })
    throw new Error('prevent vite invoke `window.location.reload`')
  })
}
