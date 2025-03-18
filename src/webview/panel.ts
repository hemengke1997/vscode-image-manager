import { trim } from 'es-toolkit'
import fs from 'fs-extra'
import path from 'node:path'
import { inject } from 'tag-inject'
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
import { type MessageType, WebviewMessageCenter } from '~/message'
import { CmdToWebview } from '~/message/cmd'
import { DEV_PORT, EXT_NAMESPACE } from '~/meta'
import { Channel } from '~/utils/channel'

export class ImageManagerPanel {
  static readonly viewType = 'ImageManagerPanel'
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: ImageManagerPanel | undefined

  /**
   * 要在viewer中打开的指定图片
   */
  public static webviewInitialData: {
    imageReveal: string
    sharpInstalled: boolean
  }

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

    // 监听webview发送的消息
    this._panel.webview.onDidReceiveMessage((msg: MessageType) => this._handleMessage(msg), null, this._disposables)

    // 监听vscode配置变化
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
        Channel.debug(`Reloading webview`)
        ImageManagerPanel.reloadWebview()
        return
      }
      if (affected) {
        // 如果是编程式修改配置，不需要更新webview
        // 比如 用户缩放图片时，会修改插件配置，这时不需要更新webview，因为webview中有图片缩放的state了
        if (Global.isProgrammaticChangeConfig) {
          Channel.debug(`Programmatic change config, skip update webview`)
          return
        }
        WebviewMessageCenter.postMessage({ cmd: CmdToWebview.update_config, data: {} })
      }
    }
  }

  /**
   * 创建或显示面板webview
   * @param ctx vscode上下文
   * @param reload 是否 reload webview
   * @param imageReveal 要打开的图片路径
   * @returns
   */
  public static createOrShow(options: {
    ctx: ExtensionContext
    reload: boolean
    /**
     * webview需要的初始化数据
     */
    webviewInitialData: {
      imageReveal: string
      sharpInstalled: boolean
    }
  }) {
    const {
      ctx,
      reload,
      webviewInitialData: { imageReveal, sharpInstalled },
    } = options
    this.webviewInitialData = {
      // 加时间戳是为了重复打开同一图片时，能够触发 imageReveal 的 effect
      imageReveal: trim(imageReveal).length ? `${trim(imageReveal)}?t=${Date.now()}` : '',
      sharpInstalled,
    }

    const panel = this.revive(ctx)
    panel._reveal(reload, this.webviewInitialData.imageReveal)
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

  private _reveal(reload: boolean, imageReveal: string) {
    const column = this._panel.viewColumn ?? ViewColumn.One

    if (reload) {
      ImageManagerPanel.reloadWebview()
    } else if (imageReveal) {
      // reloadWebview中，会在 [CmdToVscode.on_webview_ready] 时把 imageReveal 设置到 window.__reveal_image_path__
      // 所以不需要在realod中调用 revealImageInViewer
      ImageManagerPanel.revealImageInViewer(imageReveal)
    }
    this._panel.reveal(column)
  }

  /**
   * 在viewer中打开指定图片
   */
  static revealImageInViewer(imageReveal: string) {
    WebviewMessageCenter[CmdToWebview.reveal_image_in_viewer](imageReveal)
  }

  /**
   * 重启webview
   */
  static reloadWebview() {
    WebviewMessageCenter.postMessage({
      cmd: CmdToWebview.program_reload_webview,
      data: {},
    })
  }

  /**
   * 处理webview发送给vscode的消息
   */
  private async _handleMessage(message: MessageType) {
    Channel.debug(`Receive cmd: ${message.cmd}`)
    WebviewMessageCenter.handleMessages(message)
  }

  dispose() {
    ImageManagerPanel.currentPanel = undefined

    // Clean up our resources
    this._panel.dispose()

    // Dispose all the disposables
    Disposable.from(...this._disposables).dispose()

    ImageManagerPanel._onDidChanged.fire(false)
  }

  async init() {
    WebviewMessageCenter.init(this._panel.webview)

    this._panel.webview.html = await this._getWebviewHtml()
  }

  private async _getWebviewHtml() {
    const isProd = Global.isProduction()
    const webview = this._panel.webview

    let html = ''
    let content_src = ''
    let script_src = ''

    if (isProd) {
      const { htmlContent, htmlPath } = this._getHtml(['dist-webview', 'index.html'])
      html = this._transformHtml(htmlPath, htmlContent)
    } else {
      const localServerUrl = `http://localhost:${DEV_PORT}`

      const res = await fetch(`${localServerUrl}/src/webview/image-manager/index.html`, {
        headers: {
          'sec-fetch-dest': 'document',
        },
        mode: 'no-cors',
      })

      html = await res.text()
      html = html.replace(/(?<=")(\/).*"/g, (match) => `${localServerUrl}${match}`)

      content_src = `ws://${localServerUrl.replace(/https?:\/\//, '')} ws://0.0.0.0:${DEV_PORT} ${localServerUrl}`
      script_src = `${localServerUrl} http://0.0.0.0:${DEV_PORT}`
    }

    html = inject(html, [
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
