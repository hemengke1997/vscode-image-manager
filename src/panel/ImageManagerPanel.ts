import { applyHtmlTransforms } from '@minko-fe/html-transform'
import { type Context } from '@rootSrc/Context'
import { type MessageParams, type MessageType, VscodeMessageCenter } from '@rootSrc/message'
import { CmdToWebview } from '@rootSrc/message/shared'
import { Log } from '@rootSrc/utils/Log'
import fs from 'node:fs'
import path from 'node:path'
import { type Disposable, Uri, ViewColumn, type Webview, type WebviewPanel, env, window } from 'vscode'

/**
 * This class manages the state and behavior of ImageManagerPanel webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering ImageManagerPanel webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export class ImageManagerPanel {
  static currentPanel: ImageManagerPanel | undefined

  static readonly viewType = 'ImageManagerPanel'
  static readonly panelTitle = 'Image Manager'

  private readonly _panel: WebviewPanel
  private _disposables: Disposable[] = []

  constructor(panel: WebviewPanel, ctx: Context) {
    this._panel = panel
    const watcher = ctx.watcher.start(this._panel.webview)

    // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
    // the panel or when the panel is closed programmatically)
    this._panel.onDidDispose(
      () => {
        this.dispose()
        watcher.stop()
      },
      null,
      this._disposables,
    )

    // Set the HTML content for the webview panel
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, ctx)

    // Set an event listener to listen for messages passed from the webview context
    this._setWebviewMessageListener(this._panel.webview)
  }

  private _transformHtml(htmlPath: string, webview: Webview) {
    const resourcePath = Uri.file(htmlPath).fsPath
    const dirPath = path.posix.dirname(resourcePath)
    let html = fs.readFileSync(resourcePath, 'utf-8')
    html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (_, $1: string, $2: string) => {
      console.log(`webview-replace resourcePath:${resourcePath} dirPath:${dirPath} $1:${$1} $2:${$2}`)
      $2 = $2.startsWith('.') ? $2 : `.${$2}`
      const vscodeResourcePath = webview.asWebviewUri(Uri.file(path.posix.resolve(dirPath, $2))).toString()
      return `${$1 + vscodeResourcePath}"`
    })

    return html
  }

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @remarks This is also the place where references to the React webview build files
   * are created and inserted into the webview HTML.
   */
  private _getWebviewContent(webview: Webview, ctx: Context) {
    const isProd = ctx.isProductionMode

    const localPort = 4433
    const localServerUrl = `http://localhost:${localPort}`

    let html = ''
    if (isProd) {
      html = this._transformHtml(
        this._getUri(webview, ctx.ext.extensionUri, ['dist-webview', 'index.html']).fsPath,
        webview,
      )
    } else {
      // html string
      const entry = 'src/webview/main.tsx'

      const scriptUri = `${localServerUrl}/${entry}`

      const reactRefresh = /*html*/ `
        <script type="module">
          import RefreshRuntime from "${localServerUrl}/@react-refresh"
          RefreshRuntime.injectIntoGlobalHook(window)
          window.$RefreshReg$ = () => { }
          window.$RefreshSig$ = () => (type) => type
          window.__vite_plugin_react_preamble_installed__ = true
        </script>
      `

      html = /*html*/ `<!DOCTYPE html>
      <html lang="" data-theme="">
        <head>
          ${reactRefresh}
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="renderer" content="webkit">
          <title>vscode-image-manager</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="${scriptUri}"></script>
        </body>
      </html>`
    }

    html = applyHtmlTransforms(html, [
      {
        injectTo: 'head-prepend',
        tag: 'script',
        attrs: { type: 'text/javascript' },
        children: `window.vscodeTheme = '${ctx.theme}'`,
      },
      {
        injectTo: 'head',
        tag: 'script',
        attrs: { type: 'text/javascript' },
        children: `window.currentView = '${ImageManagerPanel.viewType}'`,
      },
      {
        injectTo: 'head',
        tag: 'script',
        attrs: { type: 'text/javascript' },
        children: `window.vscodeEnv = ${JSON.stringify(this._getEnvForWebview())}`,
      },
      {
        injectTo: 'head-prepend',
        tag: 'meta',
        attrs: {
          'http-equiv': 'Content-Security-Policy',
          'content': [
            `default-src 'self' https://*`,
            `connect-src 'self' https://* http://* wss://* ws://${this._removeUrlProtocol(
              localServerUrl,
            )} ws://0.0.0.0:${localPort} ${localServerUrl}`,
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

  public static render(ctx: Context, restartFlag = false) {
    if (restartFlag) {
      ImageManagerPanel.currentPanel?.dispose()
    }
    if (ImageManagerPanel.currentPanel) {
      // If the webview panel already exists reveal it
      ImageManagerPanel.currentPanel._panel.reveal(ViewColumn.One)
    } else {
      const panel = window.createWebviewPanel(
        ImageManagerPanel.viewType,
        ImageManagerPanel.panelTitle,
        ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        },
      )
      panel.iconPath = Uri.file(ctx.ext.asAbsolutePath('assets/logo.png'))

      ImageManagerPanel.currentPanel = new ImageManagerPanel(panel, ctx)
    }
    return ImageManagerPanel.currentPanel
  }

  get panel() {
    return this._panel
  }

  private invokeCallback<T>(params: { message: MessageType; webview: Webview; data: T }) {
    const { message, webview, data } = params
    if (webview) {
      // Post a message to the webview content.
      webview.postMessage({ cmd: CmdToWebview.CALLBACK_FROM_VSCODE, callbackId: message.callbackId, data })
    }
  }

  /**
   * Handles messages passed from the webview context and executes code based on the message that is recieved.
   */
  private _handlePanelMessage = async (message: MessageType, webview: Webview) => {
    Log.info(`receive msg: ${JSON.stringify(message)}`)
    const handler: (params: MessageParams) => Promise<any> = VscodeMessageCenter[message.cmd]
    if (handler) {
      const data = await handler({ message, webview })
      Log.info(`${message.cmd} return data: ${JSON.stringify(data)}`)
      this.invokeCallback({ message, webview, data })
    } else {
      Log.error(`Handler function "${message.cmd}" doesn't exist!`, true)
    }
  }

  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is recieved.
   */
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage((msg) => this._handlePanelMessage(msg, webview), undefined, this._disposables)
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    ImageManagerPanel.currentPanel = undefined

    // Dispose of the current webview panel
    this._panel.dispose()

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }

  private _removeUrlProtocol(url: string) {
    return url.replace(/https?:\/\//, '')
  }

  private _getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList))
  }

  private _getEnvForWebview() {
    return {
      language: env.language,
    }
  }
}
