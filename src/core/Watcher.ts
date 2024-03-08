import { debounce } from '@minko-fe/lodash-pro'
import micromatch from 'micromatch'
import path from 'node:path'
import { type FileSystemWatcher, RelativePattern, type Uri, type Webview, workspace } from 'vscode'
import { Config, Global } from '~/core'
import { CmdToWebview } from '~/message/cmd'
import { Log } from '~/utils/Log'
import { imageGlob } from '~/utils/glob'
import { ImageManagerPanel } from '~/webview/Panel'

export class Watcher {
  public static watchers: FileSystemWatcher[]
  public static webview: Webview
  public static glob: ReturnType<typeof imageGlob>

  static init() {
    ImageManagerPanel.onDidChange((e) => {
      if (!e) {
        // webview closed
        this.dispose()
      } else {
        // webview opened
        this.webview = e
        this._start()
      }
    })
  }

  private static _isIgnored(e: Uri, isDirectory: boolean) {
    const ignores = this.glob.ignore
    if (isDirectory) {
      ignores.unshift(...this.glob.absDirPatterns)
    } else {
      ignores.unshift(...this.glob.absImagePatterns)
    }
    return !micromatch.all(e.fsPath, ignores)
  }

  private static debouncedHandleEvent = debounce(this._handleEvent, 200)

  private static _handleEvent(e: Uri) {
    if (e.scheme !== 'file') return
    const isDirectory = !path.extname(e.fsPath)
    if (this._isIgnored(e, isDirectory)) {
      return
    }
    Log.debug(`File Changed: ${e.fsPath}, isDirectory: ${isDirectory}, trigger refresh`)
    this.webview?.postMessage({
      cmd: CmdToWebview.REFRESH_IMAGES,
    })
  }

  private static _onDidChange(e: Uri) {
    this.debouncedHandleEvent(e)
  }

  private static _onDidCreate(e: Uri) {
    this.debouncedHandleEvent(e)
  }

  private static _onDidDelete(e: Uri) {
    this.debouncedHandleEvent(e)
  }

  private static _start() {
    if (!Config.file_root.length) return

    this.glob = imageGlob({
      scan: Config.file_scan,
      exclude: Config.file_exclude,
      root: Config.file_root,
    })

    Log.info(`Watch Root: ${Config.file_root}`)

    const imageWatchers = Config.file_root.map((r) => {
      return workspace.createFileSystemWatcher(new RelativePattern(r, this.glob.imagePattern))
    })

    const folderWatchers = Config.file_root.map((r) => {
      return workspace.createFileSystemWatcher(new RelativePattern(r, '**/*'))
    })

    this.watchers = [...imageWatchers, ...folderWatchers]

    Global.context.subscriptions.push(...Watcher.watchers)

    this.watchers?.forEach((w) => w.onDidChange(this._onDidChange, this))
    this.watchers?.forEach((w) => w.onDidCreate(this._onDidCreate, this))
    this.watchers?.forEach((w) => w.onDidDelete(this._onDidDelete, this))

    return this
  }

  public static dispose() {
    this.watchers?.forEach((w) => w.dispose())
  }
}
