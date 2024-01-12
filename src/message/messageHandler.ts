import { Context } from '@rootSrc/Context'
import { imageGlob } from '@rootSrc/utils/glob'
import fg from 'fast-glob'
import imageSize from 'image-size'
import fs from 'node:fs'
import path from 'pathe'
import { Uri, type Webview, commands } from 'vscode'

class MessageHandler {
  private config: Context['config'] | undefined

  /* -------------- reload webview -------------- */
  reloadWebview() {
    commands.executeCommand('workbench.action.webview.reloadWebviewAction')
  }

  /* --------------- search images -------------- */
  private async _searchImgs(absWorkspaceFolder: string, webview: Webview, fileTypes: Set<string>, dirs: Set<string>) {
    const { config } = Context.instance
    const { all } = imageGlob({
      cwd: absWorkspaceFolder,
      imageType: config.imageType,
      exclude: config.exclude,
      root: config.root,
    })

    const imgs = await fg(all, {
      cwd: path.normalize(absWorkspaceFolder),
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
    const workspaceFolders = Context.instance.config.root

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
      absWorkspaceFolders: workspaceFolders,
      workspaceFolders: workspaceFolders.map((ws) => path.basename(ws)),
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
      this.config = Context.instance.config
    }
    return this.config
  }

  /* ----------- get compressor ---------- */
  getCompressor() {
    return Context.instance.compressor
  }

  /* ------- open path in vscode explorer ------ */
  async openImageInVscodeExplorer(targetPath: string) {
    const res = commands.executeCommand('revealInExplorer', Uri.file(targetPath))
    return res
  }

  /* --------- open path in os explorer -------- */
  async openImageInOsExplorer(targetPath: string, deep: boolean = true) {
    if (deep) {
      try {
        const files = fs.readdirSync(targetPath)
        targetPath = path.join(targetPath, files[0])
      } catch {}
    }

    const res = await commands.executeCommand('revealFileInOS', Uri.file(targetPath))

    return res
  }

  /* ------------ copy image as base64 --------- */
  async copyImageAsBase64(filePath: string): Promise<string> {
    const bitmap = await fs.promises.readFile(filePath)
    let imgType = filePath.substring(filePath.lastIndexOf('.') + 1)
    const map = {
      svg: 'svg+xml',
      tif: 'tiff',
    }
    imgType = map[imgType] ?? imgType
    const imgBase64 = `data: image/${imgType};base64,${Buffer.from(bitmap).toString('base64')}`
    return imgBase64
  }

  /* -------------- compress image -------------- */
  async compressImage(filePaths: string[]) {
    const { compressor } = Context.instance
    filePaths = filePaths.filter((file) => {
      return compressor?.config.exts.includes(path.extname(file))
    })
    const res = await compressor?.compress(filePaths)
    return res
  }

  /* ----------- test buit-in command ----------- */
  async testBuiltInCmd({ cmd, path }: { cmd: string; path: string }) {
    const uri = Uri.file(path)
    commands.executeCommand(cmd, uri)
  }
}

export const messageHandler = new MessageHandler()
