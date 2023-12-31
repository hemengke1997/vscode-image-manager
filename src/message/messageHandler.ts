import { Context } from '@rootSrc/Context'
import { getClipboard } from '@rootSrc/clipboard'
import { globImages } from '@rootSrc/helper/glob'
import fg from 'fast-glob'
import imageSize from 'image-size'
import fs from 'node:fs'
import path from 'node:path'
import { Uri, type Webview, commands } from 'vscode'

class MessageHandler {
  private config: Context['config'] | undefined

  /* -------------- reload webview -------------- */
  reloadWebview() {
    commands.executeCommand('workbench.action.webview.reloadWebviewAction')
  }

  /* --------------- search images -------------- */
  private async _searchImgs(absWorkspaceFolder: string, webview: Webview, fileTypes: Set<string>, dirs: Set<string>) {
    const imgs = await fg(globImages().all, {
      cwd: absWorkspaceFolder,
      objectMode: true,
      dot: false,
      absolute: true,
      markDirectories: true,
      stats: true,
    })

    return imgs.map((img) => {
      const vscodePath = webview.asWebviewUri(Uri.file(img.path)).toString()

      const fileType = path.extname(img.path).replace('.', '')
      fileTypes.add(fileType)
      const dirPath = path.relative(absWorkspaceFolder, path.dirname(img.path))
      dirs.add(dirPath)

      const workspaceFolder = path.basename(absWorkspaceFolder)

      return {
        name: img.name,
        path: img.path,
        stats: img.stats!,
        dirPath,
        absDirPath: path.dirname(img.path),
        fileType,
        vscodePath,
        workspaceFolder,
        absWorkspaceFolder,
        basePath: path.dirname(absWorkspaceFolder),
        extraPathInfo: path.parse(img.path),
      }
    })
  }

  async getAllImgs(webview: Webview) {
    const workspaceFolders = Context.getInstance().config.root

    const data = await Promise.all(
      workspaceFolders.map(async (workspaceFolder) => {
        const fileTypes: Set<string> = new Set()
        const dirs: Set<string> = new Set()

        const imgs = await this._searchImgs(workspaceFolder, webview, fileTypes, dirs)
        return {
          imgs,
          workspaceFolder: path.basename(workspaceFolder),
          absWorkspaceFolder: workspaceFolder,
          fileTypes: [...fileTypes].filter(Boolean),
          dirs: [...dirs].filter(Boolean),
        }
      }),
    )

    return {
      data,
      workspaceFolders,
    }
  }

  /* ----------- get image dimensions ----------- */
  getImageDimensions(imgPath: string) {
    let dimensions = { width: 0, height: 0 }

    const size = imageSize(imgPath)
    try {
      dimensions = {
        width: size.width || 0,
        height: size.height || 0,
      }
    } catch (err) {
      console.log(err)
    }
    return dimensions
  }

  /* ----------- get extension config ----------- */
  getExtConfig() {
    if (!this.config) {
      this.config = Context.getInstance().config
    }
    return this.config
  }

  /* ---------- copy image to clipboard --------- */
  async copyImage(imgPath: string) {
    const cb = await getClipboard()
    return await cb.copy(imgPath)
  }

  /* ---------------- paste image --------------- */
  async pasteImage(dest: string) {
    const cb = await getClipboard()
    return cb.pasteSync({ cwd: dest })
  }

  /* ------- open path in vscode explorer ------ */
  openImageInVscodeExplorer(targetPath: string) {
    commands.executeCommand('revealInExplorer', Uri.file(targetPath))
  }

  /* --------- open path in os explorer -------- */
  openImageInOsExplorer(targetPath: string, deep: boolean = true) {
    if (deep) {
      try {
        const files = fs.readdirSync(targetPath)
        targetPath = path.join(targetPath, files[0])
      } catch {}
    }

    commands.executeCommand('revealFileInOS', Uri.file(targetPath))
  }

  /* ------------ copy image as base64 --------- */
  copyImageAsBase64(filePath: string) {
    const bitmap = fs.readFileSync(filePath)
    let imgType = filePath.substring(filePath.lastIndexOf('.') + 1)
    const map = {
      svg: 'svg+xml',
      tif: 'tiff',
    }
    imgType = map[imgType] ?? imgType
    const imgBase64 = `data: image/${imgType};base64,${Buffer.from(bitmap).toString('base64')}`
    return imgBase64
  }

  /* ----------- test buit-in command ----------- */
  async testBuiltInCmd({ cmd, path }: { cmd: string; path: string }) {
    const uri = Uri.file(path)
    commands.executeCommand(cmd, uri)
  }
}

export const messageHandler = new MessageHandler()
