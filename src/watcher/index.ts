import { debounce } from '@minko-fe/lodash-pro'
import { type Context } from '@rootSrc/Context'
import { globImages } from '@rootSrc/helper/glob'
import { CmdToWebview } from '@rootSrc/message/shared'
import micromatch from 'micromatch'
import { type FileSystemWatcher, RelativePattern, type Uri, type Webview, workspace } from 'vscode'

class Watcher {
  private watcher: FileSystemWatcher | undefined
  public webview: Webview | undefined

  constructor(private _ctx: Context) {
    if (!this._ctx.workspaceRootPath) return
    this.watcher = workspace.createFileSystemWatcher(
      new RelativePattern(this._ctx.workspaceRootPath, globImages().patterns),
    )
  }

  private _isIgnored(e: Uri) {
    return !micromatch.all(e.path, globImages().all)
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

    this.watcher?.onDidChange(this._onDidChange, this)
    this.watcher?.onDidCreate(this._onDidCreate, this)
    this.watcher?.onDidDelete(this._onDidDelete, this)

    return this
  }

  public stop() {
    this.watcher?.dispose()
  }
}

export default Watcher
