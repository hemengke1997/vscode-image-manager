import { applyHtmlTransforms } from '@minko-fe/html-transform'
import fs from 'fs-extra'
import path from 'node:path'
import {
  Disposable,
  EventEmitter,
  type ExtensionContext,
  ExtensionMode,
  Uri,
  ViewColumn,
  type Webview,
  type WebviewPanel,
  window,
  workspace,
} from 'vscode'
import { i18n } from '~/i18n'
import { MessageCenter, type MessageType } from '~/message/MessageCenter'
import { CmdToWebview } from '~/message/cmd'
import { DEV_PORT } from '~/meta'
import { Log } from '~/utils/Log'

export class ImageManagerPanel {
  static readonly viewType = 'ImageManagerPanel'
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: ImageManagerPanel | undefined

  // events
  private static _onDidChanged = new EventEmitter<Webview | false>()
  public static onDidChange = ImageManagerPanel._onDidChanged.event

  private readonly _panel: WebviewPanel
  private readonly _ctx: ExtensionContext
  private _disposables: Disposable[] = []

  private constructor(ctx: ExtensionContext, panel: WebviewPanel) {
    this._ctx = ctx
    this._panel = panel

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
    this._panel.webview.onDidReceiveMessage((msg: MessageType) => this._handleMessage(msg), null, this._disposables)
    workspace.onDidChangeConfiguration(
      () => {
        MessageCenter.postMessage({ cmd: CmdToWebview.REFRESH_WEBVIEW, data: null })
      },
      null,
      this._disposables,
    )

    this.init()
  }

  public static createOrShow(ctx: ExtensionContext, refresh = false) {
    const panel = this.revive(ctx)
    panel._reveal(refresh)
    return panel
  }

  public static revive(ctx: ExtensionContext) {
    if (!ImageManagerPanel.currentPanel) {
      const panel = window.createWebviewPanel(ImageManagerPanel.viewType, i18n.t('pkg.title'), ViewColumn.Active, {
        enableScripts: true,
        retainContextWhenHidden: true,
      })
      panel.iconPath = Uri.file(ctx.asAbsolutePath('assets/logo.png'))
      ImageManagerPanel.currentPanel = new ImageManagerPanel(ctx, panel)
      ImageManagerPanel._onDidChanged.fire(panel.webview)
    }

    return ImageManagerPanel.currentPanel
  }

  private _reveal(refresh: boolean) {
    const column = this._panel.viewColumn ?? ViewColumn.One
    if (refresh) {
      MessageCenter.postMessage({ cmd: CmdToWebview.REFRESH_WEBVIEW, data: null })
    }
    this._panel.reveal(column)
  }

  private async _handleMessage(message: MessageType) {
    Log.info(`Receive cmd: ${message.cmd}`)
    MessageCenter.handleMessages(message)
  }

  dispose() {
    ImageManagerPanel.currentPanel = undefined

    // Clean up our resources
    this._panel.dispose()

    // Dispose all the disposables
    Disposable.from(...this._disposables).dispose()

    ImageManagerPanel._onDidChanged.fire(false)
  }

  init() {
    MessageCenter.init(this._panel.webview)

    this._panel.webview.html = this._getWebviewHtml()
  }

  private _getWebviewHtml() {
    const isProd = this._ctx.extensionMode === ExtensionMode.Production
    const webview = this._panel.webview

    const localPort = DEV_PORT
    const localServerUrl = `http://localhost:${localPort}`

    let html = ''
    if (isProd) {
      html = this._transformHtml(this._getUri(this._ctx.extensionUri, ['dist-webview', 'index.html']).fsPath)
    } else {
      function joinLocalServerUrl(path: string) {
        return `${localServerUrl}/${path}`
      }

      // html string
      const etnryScriptUri = joinLocalServerUrl('src/webview/main.tsx')
      const reactRefreshUri = joinLocalServerUrl('@react-refresh')
      const viteClientUri = joinLocalServerUrl('@vite/client')

      const reactRefresh = /*html*/ `
        <script type="module">
          import RefreshRuntime from "${reactRefreshUri}"
          RefreshRuntime.injectIntoGlobalHook(window)
          window.$RefreshReg$ = () => { }
          window.$RefreshSig$ = () => (type) => type
          window.__vite_plugin_react_preamble_installed__ = true
        </script>
      `

      const viteClient = /*html*/ `
        <script type="module" src="${viteClientUri}"></script>
      `

      html = /*html*/ `<!DOCTYPE html>
      <html lang="" data-theme="">
        <head>
          ${reactRefresh}
          ${viteClient}
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="renderer" content="webkit">
          <title>vscode-image-manager</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="${etnryScriptUri}"></script>
        </body>
      </html>`
    }

    html = applyHtmlTransforms(html, [
      {
        injectTo: 'head-prepend',
        tag: 'meta',
        attrs: {
          'http-equiv': 'Content-Security-Policy',
          'content': [
            `default-src 'self' https://*`,
            `connect-src 'self' https://\* http://\* wss://\* ws://${localServerUrl.replace(/https?:\/\//, '')} ws://0.0.0.0:${localPort} ${localServerUrl}`,
            `font-src 'self' https://* blob: data:`,
            `frame-src ${webview.cspSource} 'self' https://* blob: data:`,
            `media-src 'self' https://* blob: data:`,
            `img-src ${webview.cspSource} 'self' https://* http://* blob: data:`,
            `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://* ${localServerUrl} http://0.0.0.0:${localPort}`,
            `style-src ${webview.cspSource} 'self' 'unsafe-inline' https://* blob: data: http://*`,
          ].join('; '),
        },
      },
    ])

    return html
  }

  private _transformHtml(htmlPath: string) {
    const resourcePath = Uri.file(htmlPath).fsPath

    Log.info(`ResourcePath: ${resourcePath}`)
    const dirPath = path.dirname(resourcePath)
    let html = fs.readFileSync(resourcePath, 'utf-8')
    html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (_, $1: string, $2: string) => {
      $2 = $2.startsWith('.') ? $2 : `.${$2}`

      const vscodeResourcePath = this._panel.webview.asWebviewUri(Uri.file(path.resolve(dirPath, $2))).toString()
      return `${$1 + vscodeResourcePath}"`
    })

    return html
  }

  private _getUri(extensionUri: Uri, pathList: string[]) {
    return this._panel.webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList))
  }

  get visible() {
    return this._panel.visible
  }
}
