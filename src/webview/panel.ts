import fs from 'fs-extra'
import { nanoid } from 'nanoid'
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
import { Config } from '~/core/config/config'
import { Global } from '~/core/global'
import { i18n } from '~/i18n'
import { CmdToWebview } from '~/message/cmd'
import { type MessageType } from '~/message/message-factory'
import { WebviewMessageFactory } from '~/message/webview-message-factory'
import { DEV_PORT, EXT_NAMESPACE, PRELOAD_HELPER } from '~/meta'
import { Channel } from '~/utils/channel'

export class ImageManagerPanel {
  id: string

  // events
  private _onDidChanged = new EventEmitter<Webview | false>()
  public onDidChange = this._onDidChanged.event

  /**
   * 程序式修改配置
   */
  isProgrammaticChangeConfig = false

  panel: WebviewPanel
  webviewMessageCenter: WebviewMessageFactory
  private _disposables: Disposable[] = []

  constructor(
    readonly ctx: ExtensionContext,
    public initialData: {
      imageReveal: string
      sharpInstalled: boolean
      rootpaths: string[]
    },
  ) {
    this.id = `imageManager-${nanoid()}`
    this.panel = this.createPanel()
    this.webviewMessageCenter = new WebviewMessageFactory(this)

    // 监听面板被关闭的事件
    // 在用户关闭面板或程序化关闭面板时触发
    this.ctx.subscriptions.push(this.panel.onDidDispose(() => this.dispose(), null, this._disposables))

    // 监听webview发送的消息
    this.ctx.subscriptions.push(
      this.panel.webview.onDidReceiveMessage((msg: MessageType) => this._handleMessage(msg), null, this._disposables),
    )

    // 监听vscode配置变化
    this.ctx.subscriptions.push(workspace.onDidChangeConfiguration(this.update, null, this._disposables))

    this._getWebviewHtml().then((res) => {
      this.panel.webview.html = res
      this.panel.reveal()
    })
  }

  createPanel() {
    const panel = window.createWebviewPanel(this.id, i18n.t('pkg.title'), ViewColumn.Active, {
      enableScripts: true,
      retainContextWhenHidden: true,
    })
    panel.iconPath = Uri.file(this.ctx.asAbsolutePath('assets/logo.png'))
    return panel
  }

  show(onShow?: (panel: ImageManagerPanel) => void) {
    this.panel.reveal()
    onShow?.(this)
  }

  private update = (e?: ConfigurationChangeEvent) => {
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
        this.reloadWebview()
        return
      }
      if (affected) {
        // 如果是编程式修改配置，不需要更新webview
        // 比如 用户缩放图片时，会修改插件配置，这时不需要更新webview，因为webview中有图片缩放的state了
        if (this.isProgrammaticChangeConfig) {
          Channel.debug(`Programmatic change config, skip update webview`)
          return
        }
        this.webviewMessageCenter.postMessage({ cmd: CmdToWebview.update_config, data: {} })
      }
    }
  }

  /**
   * 在viewer中打开指定图片
   */
  revealImageInViewer(imageReveal: string) {
    this.webviewMessageCenter.postMessage<{
      imagePath: string
    }>({
      cmd: CmdToWebview.reveal_image_in_viewer,
      data: {
        imagePath: imageReveal,
      },
    })
  }

  /**
   * 重启webview
   */
  reloadWebview() {
    this.webviewMessageCenter.postMessage({
      cmd: CmdToWebview.program_reload_webview,
      data: {},
    })
  }

  /**
   * 处理webview发送给vscode的消息
   */
  private async _handleMessage(message: MessageType) {
    Channel.debug(`Receive cmd: ${message.cmd}`)
    this.webviewMessageCenter.handleMessages(message)
  }

  /**
   * 关闭面板时触发
   */
  dispose() {
    // Clean up resources
    this.panel.dispose()

    // Dispose all the disposables
    Disposable.from(...this._disposables).dispose()

    this._onDidChanged.fire(false)
  }

  private async _getWebviewHtml() {
    const isProd = Global.isProduction()
    const { webview } = this.panel

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
            `default-src 'none'`,
            `connect-src 'self' https://\* http://\* wss://\* ${content_src}`,
            `font-src 'self' vscode-webview://* https://* blob: data:`,
            `frame-src ${webview.cspSource} vscode-webview://* https://* blob: data:`,
            `media-src 'self' https://* blob: data:`,
            `img-src ${webview.cspSource} vscode-webview://* https://* http://* blob: data:`,
            `worker-src 'self' blob: https://* http://*`,
            `script-src ${webview.cspSource} vscode-webview://* 'unsafe-inline' 'unsafe-eval' https://\* ${script_src}`,
            `style-src ${webview.cspSource} 'unsafe-inline' https://* blob: data: http://*`,
          ].join('; '),
        },
      },
      {
        injectTo: 'head-prepend',
        tag: 'script',
        // 让正式环境支持资源异步加载，不然会从 vscode-webview://* 读取资源，这样会导致资源加载失败，因为正式环境的资源是放在 dist-webview 目录下的
        children: `${PRELOAD_HELPER} = '${this._getUri(['dist-webview']).toString()}'`,
      },
    ])

    return html
  }

  private _transformHtml(htmlPath: string, html: string) {
    Channel.debug(`htmlPath: ${htmlPath}`)
    const htmlDirPath = path.dirname(htmlPath)

    html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (_, $1: string, $2: string) => {
      $2 = $2.startsWith('.') ? $2 : `.${$2}`

      const vscodeResourcePath = this.panel.webview.asWebviewUri(Uri.file(path.resolve(htmlDirPath, $2))).toString()
      return `${$1 + vscodeResourcePath}"`
    })

    return html
  }

  private _getUri(pathList: string[]) {
    return this.panel.webview.asWebviewUri(Uri.joinPath(this.ctx.extensionUri, ...pathList))
  }

  private _getHtml(htmlPath: string[]) {
    const htmlWebviewPath = this._getUri(htmlPath).fsPath
    const htmlContent = fs.readFileSync(htmlWebviewPath, 'utf-8')

    Channel.debug(`htmlPath: ${htmlWebviewPath}`)

    return {
      htmlPath: htmlWebviewPath,
      htmlContent,
    }
  }

  get visible() {
    return this.panel.visible
  }
}
