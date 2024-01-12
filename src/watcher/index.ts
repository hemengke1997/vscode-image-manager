import { debounce } from '@minko-fe/lodash-pro'
import { type Context } from '@rootSrc/Context'
import { CmdToWebview } from '@rootSrc/message/shared'
import { imageGlob } from '@rootSrc/utils/glob'
import micromatch from 'micromatch'
import { type FileSystemWatcher, RelativePattern, type Uri, type Webview, workspace } from 'vscode'

class Watcher {
  private watchers: FileSystemWatcher[] | undefined
  public webview: Webview | undefined
  public glob: ReturnType<typeof imageGlob> | undefined

  constructor(private _ctx: Context) {
    if (!this._ctx.config.root.length) return

    this.glob = imageGlob({
      imageType: this._ctx.config.imageType,
      exclude: this._ctx.config.exclude,
      root: this._ctx.config.root,
    })

    const imageWatchers = this._ctx.config.root.map((r) => {
      const { pattern } = this.glob!
      return workspace.createFileSystemWatcher(new RelativePattern(r, pattern))
    })

    const folderWatchers = this._ctx.config.root.map((r) => {
      return workspace.createFileSystemWatcher(new RelativePattern(r, '**/*'), false, false, false)
    })

    this.watchers = [...imageWatchers, ...folderWatchers]
  }

  private _isIgnored(e: Uri) {
    return !micromatch.all(e.path, this.glob?.all || [])
  }

  private debouncedHandleEvent = debounce(this._handleEvent, 200, {
    leading: false,
    trailing: true,
  })

  private _handleEvent(e: Uri) {
    if (this._isIgnored(e)) return
    this.webview?.postMessage({
      cmd: CmdToWebview.IMAGES_CHANGED,
    })
  }

  private _onDidChange(e: Uri) {
    this.debouncedHandleEvent(e)
  }

  private _onDidCreate(e: Uri) {
    this.debouncedHandleEvent(e)
  }

  private _onDidDelete(e: Uri) {
    this.debouncedHandleEvent(e)
  }

  public start(webview: Webview) {
    this.webview = webview

    this.watchers?.forEach((w) => w.onDidChange(this._onDidChange, this))
    this.watchers?.forEach((w) => w.onDidCreate(this._onDidCreate, this))
    this.watchers?.forEach((w) => w.onDidDelete(this._onDidDelete, this))

    return this
  }

  public stop() {
    this.watchers?.forEach((w) => w.dispose())
  }
}

export default Watcher
