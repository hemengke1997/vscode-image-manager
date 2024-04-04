import { applyHtmlTransforms } from '@minko-fe/html-transform'
import fs from 'fs-extra'
import path from 'node:path'
import {
  type ConfigurationChangeEvent,
  Disposable,
  EventEmitter,
  type ExtensionContext,
  Uri,
  ViewColumn,
  type Webview,
  type WebviewPanel,
  window,
  workspace,
} from 'vscode'
import { Config, Global } from '~/core'
import { i18n } from '~/i18n'
import { MessageCenter, type MessageType } from '~/message/MessageCenter'
import { CmdToWebview } from '~/message/cmd'
import { DEV_PORT, EXT_NAMESPACE } from '~/meta'
import { Channel } from '~/utils/Channel'

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
    workspace.onDidChangeConfiguration(this.update, null, this._disposables)

    this.init()
  }

  update(e?: ConfigurationChangeEvent) {
    let reload = false
    if (e) {
      let affected = false

      for (const config of Config.reloadConfigs) {
        const key = `${EXT_NAMESPACE}.${config}`
        if (e.affectsConfiguration(key)) {
          affected = true
          reload = true
          Channel.info(`[Reload] Config "${key}" changed, reloading`)
          break
        }
      }

      for (const config of Config.refreshConfigs) {
        const key = `${EXT_NAMESPACE}.${config}`
        if (e.affectsConfiguration(key)) {
          affected = true
          Channel.info(`[Refresh] Config "${key}" changed`)
          break
        }
      }

      if (!affected) return

      if (reload) {
        Channel.info(`Reloading webview`)
        ImageManagerPanel._reloadWebview()
        return
      }
      if (affected) {
        if (Global.isProgrammaticChangeConfig) {
          Channel.info(`Programmatic change config, skip update webview`)
          return
        }
        MessageCenter.postMessage({ cmd: CmdToWebview.update_config, data: {} })
      }
    }
  }

  public static createOrShow(ctx: ExtensionContext, reload = false) {
    const panel = this.revive(ctx)
    panel._reveal(reload)
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

  private _reveal(reload: boolean) {
    const column = this._panel.viewColumn ?? ViewColumn.One
    if (reload) {
      ImageManagerPanel._reloadWebview()
    }
    this._panel.reveal(column)
  }

  private static _reloadWebview() {
    MessageCenter.postMessage({ cmd: CmdToWebview.program_reload_webview, data: {} })
  }

  private async _handleMessage(message: MessageType) {
    Channel.debug(`Receive cmd: ${message.cmd}`)
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
    const isProd = Global.isProduction()
    const webview = this._panel.webview

    const localServerUrl = `http://localhost:${DEV_PORT}`

    let html = ''
    let content_src = ''
    let script_src = ''

    if (isProd) {
      const { htmlContent, htmlPath } = this._getHtml(['dist-webview', 'index.html'])
      html = this._transformHtml(htmlPath, htmlContent)
    } else {
      html = this._getHtml(['index.html']).htmlContent
      function joinLocalServerUrl(path: string) {
        return `${localServerUrl}/${path}`
      }

      // html string
      const etnryScriptUri = joinLocalServerUrl('src/webview/main.tsx')
      const reactRefreshUri = joinLocalServerUrl('@react-refresh')
      const viteClientUri = joinLocalServerUrl('@vite/client')

      html = applyHtmlTransforms(html, [
        {
          injectTo: 'head-prepend',
          tag: 'script',
          attrs: {
            type: 'module',
          },
          // Taken from vite-plugin-react for HMR
          children: `
            import RefreshRuntime from "${reactRefreshUri}"
            RefreshRuntime.injectIntoGlobalHook(window)
            window.$RefreshReg$ = () => { }
            window.$RefreshSig$ = () => (type) => type
            window.__vite_plugin_react_preamble_installed__ = true
          `,
        },
        {
          injectTo: 'head-prepend',
          tag: 'script',
          attrs: {
            type: 'module',
            src: viteClientUri,
          },
        },

        {
          injectTo: 'body',
          tag: 'script',
          attrs: {
            type: 'module',
            src: etnryScriptUri,
          },
        },
      ])
      content_src = `ws://${localServerUrl.replace(/https?:\/\//, '')} ws://0.0.0.0:${DEV_PORT} ${localServerUrl}`
      script_src = `${localServerUrl} http://0.0.0.0:${DEV_PORT}`
    }

    html = applyHtmlTransforms(html, [
      {
        injectTo: 'head-prepend',
        tag: 'meta',
        attrs: {
          'http-equiv': 'Content-Security-Policy',
          'content': [
            `default-src 'self' https://*`,
            `connect-src 'self' https://\* http://\* wss://\* ${content_src}`,
            `font-src 'self' https://* blob: data:`,
            `frame-src ${webview.cspSource} 'self' https://* blob: data:`,
            `media-src 'self' https://* blob: data:`,
            `img-src ${webview.cspSource} 'self' https://* http://* blob: data:`,
            `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://\* ${script_src}`,
            `style-src ${webview.cspSource} 'self' 'unsafe-inline' https://* blob: data: http://*`,
          ].join('; '),
        },
      },
    ])

    return html
  }

  private _transformHtml(htmlPath: string, html: string) {
    Channel.debug(`htmlPath: ${htmlPath}`)
    const htmlDirPath = path.dirname(htmlPath)

    html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (_, $1: string, $2: string) => {
      $2 = $2.startsWith('.') ? $2 : `.${$2}`

      const vscodeResourcePath = this._panel.webview.asWebviewUri(Uri.file(path.resolve(htmlDirPath, $2))).toString()
      return `${$1 + vscodeResourcePath}"`
    })

    return html
  }

  private _getUri(extensionUri: Uri, pathList: string[]) {
    return this._panel.webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList))
  }

  private _getHtml(htmlPath: string[]) {
    const htmlWebviewPath = this._getUri(this._ctx.extensionUri, htmlPath).fsPath
    const htmlContent = fs.readFileSync(htmlWebviewPath, 'utf-8')

    Channel.debug(`htmlPath: ${htmlWebviewPath}`)

    return {
      htmlPath: htmlWebviewPath,
      htmlContent,
    }
  }

  get visible() {
    return this._panel.visible
  }
}
