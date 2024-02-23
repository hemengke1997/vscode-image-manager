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
    const gs = this.glob.ignore
    if (isDirectory) {
      gs.unshift(...this.glob.dirPatterns)
    } else {
      gs.unshift(...this.glob.patterns)
    }
    return gs?.every((g) => !micromatch.all(e.fsPath, g))
  }

  private static debouncedHandleEvent = debounce(this._handleEvent, 200, {
    leading: false,
    trailing: true,
  })

  private static _handleEvent(e: Uri) {
    if (e.scheme !== 'file') return
    const isDirectory = !path.extname(e.fsPath)
    if (this._isIgnored(e, isDirectory)) {
      return
    }
    debounce(() => {
      this.webview?.postMessage({
        cmd: CmdToWebview.REFRESH_IMAGES,
      })
    }, 100)()
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
    if (!Config.root.length) return

    this.glob = imageGlob({
      imageType: Config.imageType,
      exclude: Config.exclude,
      root: Config.root,
    })

    Log.info(`Watch Root: ${Config.root}`)

    const imageWatchers = Config.root.map((r) => {
      return workspace.createFileSystemWatcher(new RelativePattern(r, this.glob.pattern))
    })

    const folderWatchers = Config.root.map((r) => {
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
