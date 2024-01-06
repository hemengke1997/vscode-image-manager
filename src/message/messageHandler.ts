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
  private async _searchImgs(basePath: string, webview: Webview, fileTypes: Set<string>, dirs: Set<string>) {
    const imgs = await fg(globImages().all, {
      cwd: basePath,
      objectMode: true,
      dot: false,
      absolute: true,
      markDirectories: true,
      stats: true,
    })

    const workspaceFolder = Context.getInstance().config.root

    return imgs.map((img) => {
      const relativePath = img.path.replace(`${workspaceFolder}/`, '')

      const vscodePath = webview.asWebviewUri(Uri.file(img.path)).toString()

      const fileType = path.extname(img.path).replace('.', '')
      fileTypes.add(fileType)

      const dirPath = path.dirname(relativePath)
      dirs.add(dirPath)

      return {
        ...img,
        relativePath,
        vscodePath,
        fileType,
        dirPath,
        extraPathInfo: path.parse(relativePath),
      }
    })
  }
  async getAllImgs(webview: Webview) {
    const workspaceFolder = Context.getInstance().config.root
    const fileTypes: Set<string> = new Set()
    const dirs: Set<string> = new Set()

    const imgs = await this._searchImgs(workspaceFolder, webview, fileTypes, dirs)

    return {
      imgs,
      workspaceFolder,
      fileTypes: [...fileTypes],
      dirs: [...dirs],
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
    if (!targetPath.startsWith(this.getExtConfig().root)) {
      targetPath = path.join(this.getExtConfig().root, targetPath)
    }
    commands.executeCommand('revealInExplorer', Uri.file(targetPath))
  }

  /* --------- open path in os explorer -------- */
  openImageInOsExplorer(targetPath: string, deep: boolean = true) {
    if (!targetPath.startsWith(this.getExtConfig().root)) {
      targetPath = `${path.join(this.getExtConfig().root, targetPath)}`
    }

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
