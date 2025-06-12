import { max } from 'es-toolkit/compat'
import { type GlobbyFilterFunction, isGitIgnoredSync } from 'globby'
import micromatch from 'micromatch'
import { nanoid } from 'nanoid'
import path from 'node:path'
import {
  type ConfigurationChangeEvent,
  Disposable,
  type FileSystemWatcher,
  RelativePattern,
  type Uri,
  workspace,
} from 'vscode'
import { i18n } from '~/i18n'
import { CmdToVscode, CmdToWebview } from '~/message/cmd'
import { VscodeMessageFactory } from '~/message/message-factory'
import { EXT_NAMESPACE } from '~/meta'
import { slashPath } from '~/utils'
import { AbortError, abortPromise } from '~/utils/abort-promise'
import logger from '~/utils/logger'
import { resolveDirPath } from '~/utils/node'
import { Channel } from '~/utils/node/channel'
import { imageGlob } from '~/utils/node/glob'
import { UpdateEvent, UpdateOrigin, UpdateType } from '~/webview/image-manager/utils/tree/const'
import { type UpdatePayload } from '~/webview/image-manager/utils/tree/tree-manager'
import { type ImageManagerPanel } from '~/webview/panel'
import { ConfigKey } from './config/common'
import { Config } from './config/config'

export class Watcher {
  private watchers: FileSystemWatcher[] = []
  private glob: ReturnType<typeof imageGlob> | undefined
  private gitignores: GlobbyFilterFunction[] = []
  private rootpaths: string[] = []

  private disposables: Disposable[] = []

  constructor(
    rootpaths: string[],
    private imageManagerPanel: ImageManagerPanel,
  ) {
    this.restart(rootpaths)

    workspace.onDidChangeConfiguration(
      (e: ConfigurationChangeEvent) => {
        for (const config of [ConfigKey.file_exclude, ConfigKey.file_scan, ConfigKey.file_gitignore]) {
          const key = `${EXT_NAMESPACE}.${config}`
          if (e.affectsConfiguration(key)) {
            this.restart(this.rootpaths)
            logger.debug(`Watcher: ${key} changed`)
            break
          }
        }
      },
      null,
      this.disposables,
    )
  }

  restart(rootpaths: string[]) {
    this.dispose()
    this.glob = imageGlob({
      scan: Config.file_scan,
      exclude: Config.file_exclude,
      cwds: rootpaths,
    })
    this.startWatch(rootpaths)
  }

  private isIgnored(e: Uri, isDirectory: boolean) {
    if (this.isGitIgnored(e)) {
      return true
    }

    if (isDirectory) {
      return !micromatch.all(this.fsPath(e), this.glob!.allCwdPatterns)
    }

    return !micromatch.all(this.fsPath(e), this.glob!.allImagePatterns)
  }

  private eventQueue: { e: Uri; type: UpdateEvent; isDirectory: boolean }[] = []
  private eventProcessingTimer: NodeJS.Timeout | null = null
  private abortController: AbortController | null = null

  private async processEventQueue() {
    // 合并队列中的事件
    const uniqueEvents = this.mergeEvents(this.eventQueue)

    try {
      const payloads = (
        await abortPromise(() => this.processEvents(uniqueEvents), {
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

  private processEvents(events: typeof this.eventQueue) {
    return Promise.all(
      events.map(async (event): Promise<UpdatePayload | undefined> => {
        const { e, type, isDirectory } = event

        const basename = path.basename(this.fsPath(e))
        const absWorkspaceFolder = this.guessCwdFromPath(this.fsPath(e))
        const dirPath = resolveDirPath(this.fsPath(e), absWorkspaceFolder)
        const workspaceFolder = path.basename(absWorkspaceFolder)

        if (isDirectory) {
          // 目录不会触发 onDidChange
          switch (type) {
            // 如果是创建目录，则需要获取目录下的所有图片
            case UpdateEvent.create: {
              VscodeMessageFactory[CmdToVscode.get_all_images_from_cwds](
                { glob: this.fsPath(e) },
                this.imageManagerPanel,
              )
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
                absDirPath: this.fsPath(e),
                dirPath,
                workspaceFolder,
              },
            },
          }
        } else {
          // 1. 如果有新增，则把新增图片查询出来，返回给webview
          // 2. 如果有修改，也需要查询修改后的图片
          // 3. 如果有删除，只需要返回删除的图片路径
          if ([UpdateEvent.create, UpdateEvent.update].includes(type)) {
            const res = await VscodeMessageFactory[CmdToVscode.get_images](
              {
                filePaths: [this.fsPath(e)],
                cwd: absWorkspaceFolder,
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
            const parsedPath = path.parse(this.fsPath(e))
            return {
              origin: UpdateOrigin.image,
              data: {
                payload: {
                  path: this.fsPath(e),
                  name: parsedPath.name,
                  extname: parsedPath.ext.replace('.', ''),
                  basename,
                  dirPath,
                  workspaceFolder,
                  absWorkspaceFolder,
                } as ImageType,
                type,
              },
            }
          }
        }
      }),
    )
  }

  /**
   * 兼容 Windows 和 Linux 的路径
   */
  private fsPath(e: Uri) {
    return slashPath(e.fsPath)
  }

  private guessCwdFromPath(path: string) {
    const weight = this.rootpaths.map((r) => r.split(path)[0].length)
    const index = weight.indexOf(max(weight)!)
    return this.rootpaths[index]
  }

  private mergeEvents(events: typeof this.eventQueue) {
    const eventMap = new Map<string, (typeof events)[number]>()

    for (const event of events) {
      const key = slashPath(event.e.fsPath)
      // 如果已经存在该路径的事件，则后来的事件覆盖之前的事件
      eventMap.set(key, event)
    }

    return Array.from(eventMap.values())
  }

  private handleEvent(e: Uri, type: UpdateEvent) {
    if (e.scheme !== 'file') return

    const isDirectory = !path.extname(this.fsPath(e))

    if (this.isIgnored(e, isDirectory)) {
      logger.debug(`Ignored: ${this.fsPath(e)}`)
      return
    }

    // 将事件加入队列
    this.eventQueue.push({ e, type, isDirectory })

    this.eventProcessingTimer && clearTimeout(this.eventProcessingTimer)
    this.eventProcessingTimer = null

    this.abortController?.abort()
    this.abortController = new AbortController()

    this.eventProcessingTimer = setTimeout(() => {
      this.processEventQueue()
    }, 120) // timer大的话，会影响第一次的响应时间，所以要尽量小，但也要保持好防抖
  }

  private onDidChange(e: Uri) {
    this.handleEvent(e, UpdateEvent.update)
  }

  private onDidCreate(e: Uri) {
    this.handleEvent(e, UpdateEvent.create)
  }

  private onDidDelete(e: Uri) {
    this.handleEvent(e, UpdateEvent.delete)
  }

  private isGitIgnored(e: Uri) {
    if (!Config.file_gitignore) return false

    const ignored = this.gitignores.some((fn) => fn(this.fsPath(e)))
    if (ignored) {
      logger.debug(`git ignored: ${this.fsPath(e)}`)
    }
    return ignored
  }

  private startWatch(rootpaths: string[]) {
    this.rootpaths = rootpaths
    this.gitignores = rootpaths.map((r) => isGitIgnoredSync({ cwd: r })).filter((t) => !!t)

    Channel.info(i18n.t('prompt.watch_root', rootpaths.join(',')))

    const watcher = rootpaths.map((r) => {
      return workspace.createFileSystemWatcher(new RelativePattern(r, '**/'))
    })

    this.watchers = [...watcher]

    this.watchers?.forEach((w) => w.onDidChange(this.onDidChange, this))
    this.watchers?.forEach((w) => w.onDidCreate(this.onDidCreate, this))
    this.watchers?.forEach((w) => w.onDidDelete(this.onDidDelete, this))
  }

  public dispose() {
    Disposable.from(...this.disposables, ...this.watchers).dispose()
    this.eventProcessingTimer && clearTimeout(this.eventProcessingTimer)
    this.abortController?.abort()
    Channel.debug('Watcher disposed')
  }
}
