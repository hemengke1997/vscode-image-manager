import { applyHtmlTransforms } from '@minko-fe/html-transform'
import { type Context } from '@root/Context'
import { getEnvForWebview, getUri, logInfo, removeUrlProtocol, showError } from '@root/helper/utils'
import { type MessageType, vscodeMessageCenter } from '@root/message'
import { CallbackFromVscode } from '@root/message/shared'
import fs from 'node:fs'
import path from 'node:path'
import { type Disposable, Uri, ViewColumn, type Webview, type WebviewPanel, window } from 'vscode'

/**
 * This class manages the state and behavior of ImageAnalysorPanel webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering ImageAnalysorPanel webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export class ImageAnalysorPanel {
  static currentPanel: ImageAnalysorPanel | undefined

  static readonly viewType = 'ImageAnalysorPanel'
  static readonly panelTitle = 'Images Analysor'

  private readonly _panel: WebviewPanel
  private _disposables: Disposable[] = []

  constructor(panel: WebviewPanel, ctx: Context) {
    this._panel = panel

    // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
    // the panel or when the panel is closed programmatically)
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    // Set the HTML content for the webview panel
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, ctx)

    // Set an event listener to listen for messages passed from the webview context
    this._setWebviewMessageListener(this._panel.webview)
  }

  private _transformHtml(htmlPath: string, webview: Webview) {
    const resourcePath = Uri.file(htmlPath).fsPath
    const dirPath = path.dirname(resourcePath)
    let html = fs.readFileSync(resourcePath, 'utf-8')
    html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (_, $1: string, $2: string) => {
      logInfo(`webview-replace resourcePath:${resourcePath} dirPath:${dirPath} $1:${$1} $2:${$2}`)
      $2 = $2.startsWith('.') ? $2 : `.${$2}`
      const vscodeResourcePath = webview.asWebviewUri(Uri.file(path.resolve(dirPath, $2))).toString()
      return `${$1 + vscodeResourcePath}"`
    })

    return html
  }

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @remarks This is also the place where references to the React webview build files
   * are created and inserted into the webview HTML.
   *
   * @param webview A reference to the extension webview
   * @returns A template string literal containing the HTML that should be
   * rendered within the webview panel
   */
  private _getWebviewContent(webview: Webview, ctx: Context) {
    const isProd = ctx.isProductionMode

    const localPort = 4433
    const localServerUrl = `http://localhost:${localPort}`

    let html = ''
    if (isProd) {
      html = this._transformHtml(getUri(webview, ctx.ext.extensionUri, ['dist-webview', 'index.html']).fsPath, webview)
    } else {
      // html string
      const entry = 'src/webview/index.tsx'

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
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="renderer" content="webkit">
          <title>vscode-image-analysor</title>
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
        children: `window.currentView = '${ImageAnalysorPanel.viewType}'`,
      },
      {
        injectTo: 'head',
        tag: 'script',
        attrs: { type: 'text/javascript' },
        children: `window.vscodeEnv = ${JSON.stringify(getEnvForWebview())}`,
      },
      {
        injectTo: 'head-prepend',
        tag: 'meta',
        attrs: {
          'http-equiv': 'Content-Security-Policy',
          'content': [
            `default-src 'self' https://*`,
            `connect-src 'self' https://* http://* wss://* ws://${removeUrlProtocol(
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

  public static render(ctx: Context) {
    if (ImageAnalysorPanel.currentPanel) {
      // If the webview panel already exists reveal it
      ImageAnalysorPanel.currentPanel._panel.reveal(ViewColumn.One)
    } else {
      const panel = window.createWebviewPanel(
        ImageAnalysorPanel.viewType,
        ImageAnalysorPanel.panelTitle,
        ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        },
      )
      panel.iconPath = Uri.file(ctx.ext.asAbsolutePath('assets/logo.png'))

      ImageAnalysorPanel.currentPanel = new ImageAnalysorPanel(panel, ctx)
    }
    return ImageAnalysorPanel.currentPanel
  }

  get panel() {
    return this._panel
  }

  private invokeCallback<T>(params: { message: MessageType; webview: Webview; data: T }) {
    const { message, webview, data } = params
    if (webview) {
      // webview post message to webview listener
      webview.postMessage({ cmd: CallbackFromVscode, callbackId: message.callbackId, data })
    }
  }

  /**
   * Handles messages passed from the webview context and executes code based on the message that is recieved.
   *
   * @param message The message that was passed from the webview context
   * @param webview A reference to the extension webview
   */
  private _handlePanelMessage = async (message: MessageType, webview: Webview) => {
    logInfo(`receive msg: ${JSON.stringify(message)}`)
    const handler = vscodeMessageCenter[message.cmd]
    if (handler) {
      const data = await handler({ message, webview })
      if (data) {
        this.invokeCallback({ message, webview, data })
      }
    } else {
      showError(`Handler function "${message.cmd}" doesn't exist!`)
    }
  }

  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is recieved.
   *
   * @param webview A reference to the extension webview
   * @param context A reference to the extension context
   */
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage((msg) => this._handlePanelMessage(msg, webview), undefined, this._disposables)
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    ImageAnalysorPanel.currentPanel = undefined

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
}
