import debounce from 'debounce'
import { type GlobbyFilterFunction, isGitIgnoredSync } from 'globby'
import micromatch from 'micromatch'
import path from 'node:path'
import { type FileSystemWatcher, RelativePattern, type Uri, type Webview, workspace } from 'vscode'
import { CmdToWebview } from '~/message/cmd'
import { Channel } from '~/utils/channel'
import { imageGlob } from '~/utils/glob'
import logger from '~/utils/logger'
import { Config } from './config/config'
import { Global } from './global'

export class Watcher {
  public watchers: FileSystemWatcher[] = []
  public glob: ReturnType<typeof imageGlob>
  public gitignores: GlobbyFilterFunction[] = []

  constructor(
    rootpaths: string[],
    public webview: Webview,
  ) {
    this.glob = imageGlob({
      scan: Config.file_scan,
      exclude: Config.file_exclude,
      cwds: rootpaths,
    })

    this._start(rootpaths)
  }

  private _isIgnored(e: Uri, isDirectory: boolean) {
    if (this._isGitIgnored(e)) {
      return true
    }

    if (isDirectory) {
      return !micromatch.all(e.fsPath || e.path, this.glob.allCwdPatterns)
    }

    return !micromatch.all(e.fsPath || e.path, this.glob.allImagePatterns)
  }

  private handleEvent = debounce(this._handleEvent, 200, {
    immediate: true,
  })

  private _handleEvent(e: Uri, type: 'change' | 'create' | 'delete') {
    if (e.scheme !== 'file') return

    const isDirectory = !path.extname(e.fsPath || e.path)

    if (this._isIgnored(e, isDirectory)) {
      logger.debug(`Ignored: ${e.fsPath || e.path}`)
      return
    }

    Channel.debug(`File ${type}: ${e.fsPath || e.path}, Is Dir: ${isDirectory}, Trigger Refresh`)

    this.webview?.postMessage({
      cmd: CmdToWebview.refresh_images,
    })
  }

  private _onDidChange(e: Uri) {
    this.handleEvent(e, 'change')
  }

  private _onDidCreate(e: Uri) {
    this.handleEvent(e, 'create')
  }

  private _onDidDelete(e: Uri) {
    this.handleEvent(e, 'delete')
  }

  private _isGitIgnored(e: Uri) {
    if (!Config.file_gitignore) return false

    const ignored = this.gitignores.some((fn) => fn(e.fsPath || e.path))
    if (ignored) {
      logger.debug(`git ignored: ${e.fsPath || e.path}`)
    }
    return ignored
  }

  private _start(rootpaths: string[]) {
    if (!rootpaths.length || !this.webview) {
      return
    }

    this.gitignores = rootpaths.map((r) => isGitIgnoredSync({ cwd: r })).filter((t) => !!t)

    Channel.debug(`Watch Root: ${rootpaths.join(',')}`)

    const watcher = rootpaths.map((r) => {
      return workspace.createFileSystemWatcher(new RelativePattern(r, '**/'))
    })

    this.watchers = [...watcher]

    Global.context.subscriptions.push(...this.watchers)

    this.watchers?.forEach((w) => w.onDidChange(this._onDidChange, this))
    this.watchers?.forEach((w) => w.onDidCreate(this._onDidCreate, this))
    this.watchers?.forEach((w) => w.onDidDelete(this._onDidDelete, this))
  }

  public dispose() {
    this.watchers?.forEach((w) => w.dispose())
  }
}
