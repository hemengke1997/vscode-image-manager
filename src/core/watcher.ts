import debounce from 'debounce'
import { type GlobbyFilterFunction, isGitIgnoredSync } from 'globby'
import micromatch from 'micromatch'
import path from 'node:path'
import { type FileSystemWatcher, RelativePattern, type Uri, type Webview, workspace } from 'vscode'
import { Config, Global } from '~/core'
import { CmdToWebview } from '~/message/cmd'
import { Channel } from '~/utils/channel'
import { imageGlob } from '~/utils/glob'
import logger from '~/utils/logger'
import { ImageManagerPanel } from '~/webview/panel'

export class Watcher {
  public static watchers: FileSystemWatcher[]
  public static webview: Webview | undefined
  public static glob: ReturnType<typeof imageGlob>
  public static gitignores: GlobbyFilterFunction[] = []

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
    if (this._isGitIgnored(e)) {
      return true
    }

    if (isDirectory) {
      return !micromatch.all(e.fsPath || e.path, this.glob.allCwdPatterns)
    }

    return !micromatch.all(e.fsPath || e.path, this.glob.allImagePatterns)
  }

  private static handleEvent = debounce(this._handleEvent, 200, {
    immediate: true,
  })

  private static _handleEvent(e: Uri, type: 'change' | 'create' | 'delete') {
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

  private static _onDidChange(e: Uri) {
    this.handleEvent(e, 'change')
  }

  private static _onDidCreate(e: Uri) {
    this.handleEvent(e, 'create')
  }

  private static _onDidDelete(e: Uri) {
    this.handleEvent(e, 'delete')
  }

  private static _isGitIgnored(e: Uri) {
    if (!Config.file_gitignore) return false

    const ignored = this.gitignores.some((fn) => fn(e.fsPath || e.path))
    if (ignored) {
      logger.debug(`git ignored: ${e.fsPath || e.path}`)
    }
    return ignored
  }

  private static _start(rootpaths: string[]) {
    this.dispose()

    if (!rootpaths.length || !this.webview) {
      return
    }

    this.glob = imageGlob({
      scan: Config.file_scan,
      exclude: Config.file_exclude,
      cwds: rootpaths,
    })

    this.gitignores = rootpaths.map((r) => isGitIgnoredSync({ cwd: r })).filter((t) => !!t)

    Channel.debug(`Watch Root: ${rootpaths.join(',')}`)

    const watcher = rootpaths.map((r) => {
      return workspace.createFileSystemWatcher(new RelativePattern(r, '**/'))
    })

    this.watchers = [...watcher]

    Global.context.subscriptions.push(...Watcher.watchers)

    this.watchers?.forEach((w) => w.onDidChange(this._onDidChange, this))
    this.watchers?.forEach((w) => w.onDidCreate(this._onDidCreate, this))
    this.watchers?.forEach((w) => w.onDidDelete(this._onDidDelete, this))
  }

  public static dispose() {
    this.watchers?.forEach((w) => w.dispose())
  }
}
