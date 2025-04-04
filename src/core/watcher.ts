import { max } from 'es-toolkit/compat'
import { type GlobbyFilterFunction, isGitIgnoredSync } from 'globby'
import micromatch from 'micromatch'
import { nanoid } from 'nanoid'
import path from 'node:path'
import { type FileSystemWatcher, RelativePattern, type Uri, workspace } from 'vscode'
import { CmdToVscode, CmdToWebview } from '~/message/cmd'
import { VscodeMessageFactory } from '~/message/message-factory'
import { resolveDirPath } from '~/utils'
import { AbortError, abortPromise } from '~/utils/abort-promise'
import { Channel } from '~/utils/channel'
import { imageGlob } from '~/utils/glob'
import logger from '~/utils/logger'
import { UpdateEvent, UpdateOrigin, UpdateType } from '~/webview/image-manager/utils/tree/const'
import { type UpdatePayload } from '~/webview/image-manager/utils/tree/tree-manager'
import { type ImageManagerPanel } from '~/webview/panel'
import { Config } from './config/config'
import { Global } from './global'

export class Watcher {
  public watchers: FileSystemWatcher[] = []
  public glob: ReturnType<typeof imageGlob>
  public gitignores: GlobbyFilterFunction[] = []

  constructor(
    public rootpaths: string[],
    public imageManagerPanel: ImageManagerPanel,
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
      return !micromatch.all(e.path, this.glob.allCwdPatterns)
    }

    return !micromatch.all(e.path, this.glob.allImagePatterns)
  }

  private eventQueue: { e: Uri; type: UpdateEvent; isDirectory: boolean }[] = []
  private eventProcessingTimer: NodeJS.Timeout | null = null
  private abortController: AbortController | null = null

  private async _processEventQueue() {
    // 合并队列中的事件
    const uniqueEvents = this._mergeEvents(this.eventQueue)

    try {
      const payloads = (
        await abortPromise(() => this._processEvents(uniqueEvents), {
          abortController: this.abortController!,
        })
      ).filter((p) => !!p)

      this.imageManagerPanel.messageCenter.postMessage({
        cmd: CmdToWebview.update_images,
        data: {
          updateType: UpdateType.patch,
          payloads,
          id: nanoid(),
        },
      })

      this.eventQueue = []
    } catch (e) {
      if (e instanceof AbortError) {
        logger.debug('Event processing aborted')
      }
    }
  }

  private _processEvents(events: typeof this.eventQueue) {
    // 1. 如果有新增，则把新增图片查询出来，返回给webview
    // 2. 如果有修改，也需要查询修改后的图片
    // 3. 如果有删除，只需要返回删除的图片路径
    return Promise.all(
      events.map(async (event): Promise<UpdatePayload | undefined> => {
        const { e, type, isDirectory } = event

        if (isDirectory) {
          switch (type) {
            case UpdateEvent.create: {
              VscodeMessageFactory[CmdToVscode.get_all_images_from_cwds]({ glob: e.path }, this.imageManagerPanel)
              break
            }
            default: {
              break
            }
          }
          return {
            origin: UpdateOrigin.dir,
            data: {
              type,
              payload: {
                dirPath: resolveDirPath(e.path, this._guessCwdFromPath(e.path), true),
                absDirPath: e.path,
                workspaceFolder: path.basename(this._guessCwdFromPath(e.path)),
              },
            },
          }
        } else {
          if ([UpdateEvent.create, UpdateEvent.update].includes(type)) {
            const res = await VscodeMessageFactory[CmdToVscode.get_images](
              {
                filePaths: [e.path],
                cwd: this._guessCwdFromPath(e.path),
              },
              this.imageManagerPanel,
            )
            return {
              origin: UpdateOrigin.image,
              data: {
                type,
                payload: res[0],
              },
            }
          }
          if (type === UpdateEvent.delete) {
            const parsedPath = path.parse(e.path)
            return {
              origin: UpdateOrigin.image,
              data: {
                payload: {
                  path: e.path,
                  name: parsedPath.name,
                  basename: path.basename(e.path),
                  dirPath: resolveDirPath(e.path, this._guessCwdFromPath(e.path)),
                  extname: parsedPath.ext.replace('.', ''),
                  workspaceFolder: path.basename(this._guessCwdFromPath(e.path)),
                  absWorkspaceFolder: this._guessCwdFromPath(e.path),
                } as ImageType,
                type,
              },
            }
          }
        }
      }),
    )
  }

  private _guessCwdFromPath(path: string) {
    const weight = this.rootpaths.map((r) => r.split(path)[0].length)
    const index = weight.indexOf(max(weight)!)
    return this.rootpaths[index]
  }

  private _mergeEvents(events: typeof this.eventQueue) {
    const eventMap = new Map<string, (typeof events)[number]>()

    for (const event of events) {
      const key = event.e.path
      // 如果已经存在该路径的事件，则后来的事件覆盖之前的事件
      eventMap.set(key, event)
    }

    return Array.from(eventMap.values())
  }

  private handleEvent(e: Uri, type: UpdateEvent) {
    if (e.scheme !== 'file') return

    const isDirectory = !path.extname(e.path)

    if (this._isIgnored(e, isDirectory)) {
      logger.debug(`Ignored: ${e.path}`)
      return
    }

    // 将事件加入队列
    this.eventQueue.push({ e, type, isDirectory })

    this.eventProcessingTimer && clearTimeout(this.eventProcessingTimer)
    this.eventProcessingTimer = null

    this.abortController?.abort()
    this.abortController = new AbortController()

    this.eventProcessingTimer = setTimeout(() => {
      this._processEventQueue()
    }, 120) // timer大的话，会影响第一次的响应时间，所以要尽量小，但也要保持好防抖
  }

  private _onDidChange(e: Uri) {
    this.handleEvent(e, UpdateEvent.update)
  }

  private _onDidCreate(e: Uri) {
    this.handleEvent(e, UpdateEvent.create)
  }

  private _onDidDelete(e: Uri) {
    this.handleEvent(e, UpdateEvent.delete)
  }

  private _isGitIgnored(e: Uri) {
    if (!Config.file_gitignore) return false

    const ignored = this.gitignores.some((fn) => fn(e.path))
    if (ignored) {
      logger.debug(`git ignored: ${e.path}`)
    }
    return ignored
  }

  private _start(rootpaths: string[]) {
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
    this.eventProcessingTimer && clearTimeout(this.eventProcessingTimer)
    this.abortController?.abort()
    Channel.debug('Watcher disposed')
  }
}
