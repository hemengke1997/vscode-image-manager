import { debounce } from '@minko-fe/lodash-pro'
import micromatch from 'micromatch'
import path from 'node:path'
import { type FileSystemWatcher, RelativePattern, type Uri, type Webview, workspace } from 'vscode'
import { Config, Global } from '~/core'
import { CmdToWebview } from '~/message/cmd'
import { Channel } from '~/utils/channel'
import { imageGlob } from '~/utils/glob'
import { ImageManagerPanel } from '~/webview/panel'

export class Watcher {
  public static watchers: FileSystemWatcher[]
  public static webview: Webview | undefined
  public static glob: ReturnType<typeof imageGlob>

  static init() {
    ImageManagerPanel.onDidChange((e) => {
      if (!e) {
        // webview closed
        this.dispose()
        this.webview = undefined
      } else {
        // webview opened
        this.webview = e
        this._start(Global.rootpaths)
      }
    })

    Global.onDidChangeRootPath((rootpaths: string[]) => {
      this._start(rootpaths)
    })
  }

  private static _isIgnored(e: Uri, isDirectory: boolean) {
    const ignores = [...this.glob.ignore]
    if (isDirectory) {
      ignores.unshift(...this.glob.absDirPatterns)
    } else {
      ignores.unshift(...this.glob.absImagePatterns)
    }

    return !micromatch.all(e.fsPath || e.path, ignores)
  }

  private static debouncedHandleEvent = debounce(this._handleEvent, 500)

  private static _handleEvent(e: Uri, type: 'change' | 'create' | 'delete') {
    if (e.scheme !== 'file') return
    const isDirectory = !path.extname(e.fsPath || e.path)
    if (this._isIgnored(e, isDirectory)) {
      return
    }
    Channel.debug(`文件 ${type}: ${e.fsPath || e.path}, 是否为目录: ${isDirectory}, 触发刷新`)
    this.webview?.postMessage({
      cmd: CmdToWebview.refresh_images,
    })
  }

  private static _onDidChange(e: Uri) {
    this.debouncedHandleEvent(e, 'change')
  }

  private static _onDidCreate(e: Uri) {
    this.debouncedHandleEvent(e, 'create')
  }

  private static _onDidDelete(e: Uri) {
    this.debouncedHandleEvent(e, 'delete')
  }

  private static _start(rootpaths: string[]) {
    this.dispose()

    if (!rootpaths.length || !this.webview) {
      return
    }

    this.glob = imageGlob({
      scan: Config.file_scan,
      exclude: Config.file_exclude,
      root: rootpaths,
    })

    Channel.debug(`监听根目录: ${rootpaths.join(',')}`)

    const imageWatchers = rootpaths.map((r) => {
      return workspace.createFileSystemWatcher(new RelativePattern(r, this.glob.imagePattern))
    })

    const folderWatchers = rootpaths.map((r) => {
      return workspace.createFileSystemWatcher(new RelativePattern(r, '**/*'))
    })

    this.watchers = [...imageWatchers, ...folderWatchers]

    Global.context.subscriptions.push(...Watcher.watchers)

    this.watchers?.forEach((w) => w.onDidChange(this._onDidChange, this))
    this.watchers?.forEach((w) => w.onDidCreate(this._onDidCreate, this))
    this.watchers?.forEach((w) => w.onDidDelete(this._onDidDelete, this))
  }

  public static dispose() {
    this.watchers?.forEach((w) => w.dispose())
  }
}
