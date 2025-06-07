import { isEqual, once, trim } from 'es-toolkit'
import path from 'node:path'
import { commands, FileType, type Uri, workspace } from 'vscode'
import { Config } from '~/core/config/config'
import { Global } from '~/core/global'
import { Svgo } from '~/core/operator/svgo'
import { WorkspaceState } from '~/core/persist/workspace/workspace-state'
import { Installer } from '~/core/sharp/installer'
import { Watcher } from '~/core/watcher'
import { type ExtensionModule } from '~/module'
import { slashPath } from '~/utils'
import logger from '~/utils/logger'
import { ImageManagerPanel } from '~/webview/panel'
import { Commands } from './commands'

export default <ExtensionModule>function (ctx) {
  let rootpaths = Global.resolveRootPath()
  let previousRoot: string[] = []
  let sharpInstalled: boolean

  const init = once(() => {
    Global.installer = new Installer({
      timeout: 30 * 1000, // 30s
    })

    WorkspaceState.init()
    Svgo.init()
  })

  let isLoading = false
  async function openWebview(uri: Uri | undefined) {
    init()

    if (isLoading) return

    isLoading = true

    let imagePath = ''
    if (uri?.fsPath) {
      let rootPath = ''
      const fsPath = slashPath(uri.fsPath)
      const stat = await workspace.fs.stat(uri)
      if (stat.type !== FileType.Directory) {
        rootPath = path.dirname(fsPath)
        imagePath = fsPath
      } else {
        rootPath = fsPath
      }

      rootpaths = Global.resolveRootPath([rootPath])
    }

    try {
      if (Config.core_installDependencies) {
        // 不必每次打开插件时都安装 sharp
        // 只要一次失败，就认为不支持 sharp
        if (sharpInstalled === undefined) {
          await Global.installSharp()
          sharpInstalled = true
        }
      }
    } catch (e) {
      logger.error(e)
      sharpInstalled = false
    } finally {
      isLoading = false

      const imageReveal = trim(imagePath).length ? `${trim(imagePath)}?t=${Date.now()}` : ''

      const createPanel = (rootpaths: string[]) => {
        const imageManagerPanel = new ImageManagerPanel(ctx, {
          sharpInstalled,
          imageReveal,
          rootpaths,
        })

        Global.imageManagerPanels.push(imageManagerPanel)
        imageManagerPanel.watcher = new Watcher(rootpaths, imageManagerPanel)

        imageManagerPanel.onDidChange((e) => {
          if (!e) {
            Global.imageManagerPanels = Global.imageManagerPanels.filter((p) => p.id !== imageManagerPanel.id)
          }
        })
      }

      if (Config.core_multiplePanels) {
        createPanel(rootpaths)
      } else {
        if (Global.imageManagerPanels.length) {
          const reload = !isEqual(previousRoot, rootpaths)

          const onPanelOpen = (panel: ImageManagerPanel) => {
            // 如果前后的 rootpaths 不一样，则reload webview
            if (reload) {
              panel.reloadWebview()
            } else if (imageReveal) {
              panel.revealImageInViewer(imageReveal)
            }
          }

          const imageManagerPanel = Global.imageManagerPanels[0]

          imageManagerPanel.initialData = {
            ...imageManagerPanel.initialData,
            imageReveal,
            rootpaths,
          }

          Global.imageManagerPanels[0].show(onPanelOpen)
          // rootpaths变了，重新watch
          if (reload) {
            imageManagerPanel.watcher?.restart(rootpaths)
          }
        } else {
          createPanel(rootpaths)
        }
      }

      previousRoot = rootpaths
    }
  }

  return [commands.registerCommand(Commands.open_webview, openWebview)]
}
