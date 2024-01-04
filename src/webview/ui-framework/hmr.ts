import { CmdToVscode } from '../../message/shared'
import { vscodeApi } from '../vscode-api'

if (import.meta.hot) {
  // aviod empty webview on full reload
  import.meta.hot.on('vite:beforeFullReload', () => {
    vscodeApi.postMessage({ cmd: CmdToVscode.RELOAD_WEBVIEW })
  })
}
