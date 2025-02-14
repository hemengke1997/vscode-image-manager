import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '~/webview/vscode-api'

if (import.meta.hot) {
  function avoidEmptyWebview() {
    if (window.__reveal_image_path__) {
      vscodeApi.postMessage(
        {
          cmd: CmdToVscode.reveal_image_in_viewer,
          data: {
            filePath: '',
          },
        },
        () => {
          vscodeApi.postMessage({ cmd: CmdToVscode.reload_webview })
        },
      )
    } else {
      vscodeApi.postMessage({ cmd: CmdToVscode.reload_webview })
    }

    throw new Error('prevent vite invoke `window.location.reload`')
  }

  // aviod empty webview on full reload
  import.meta.hot.on('vite:beforeFullReload', () => {
    avoidEmptyWebview()
  })
  import.meta.hot.on('vite:ws:disconnect', () => {
    avoidEmptyWebview()
  })
  import.meta.hot.on('vite:error', () => {
    avoidEmptyWebview()
  })
}
