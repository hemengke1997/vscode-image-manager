import { getClipboard } from '@root/clipboard'
import { Config } from '@root/config'
import { getProjectPath } from '@root/helper/utils'
import fg from 'fast-glob'
import imageSize from 'image-size'
import path from 'node:path'
import { Uri, type Webview, commands } from 'vscode'

class MessageHandler {
  /* -------------- reload webview -------------- */
  reloadWebview() {
    commands.executeCommand('workbench.action.webview.reloadWebviewAction')
  }

  /* --------------- search images -------------- */
  private async _searchImgs(basePath: string, webview: Webview, fileTypes: Set<string>, dirs: Set<string>) {
    const imgs = await fg([`**/*.{${Config.imageType.join(',')}}`], {
      cwd: basePath,
      objectMode: true,
      dot: false,
      absolute: true,
      markDirectories: true,
      stats: true,
      ignore: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/out/**',
        '**/coverage/**',
        '**/.next/**',
        '**/.nuxt/**',
        '**/.vercel/**',
        // https://www.npmjs.com/package/fast-glob#pattern-syntax
        ...Config.exclude,
      ],
    })

    return imgs.map((img) => {
      const relativePath = img.path.replace(`${getProjectPath()}/`, '')

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
    const projectPath = getProjectPath()
    const fileTypes: Set<string> = new Set()
    const dirs: Set<string> = new Set()

    const imgs = await this._searchImgs(projectPath, webview, fileTypes, dirs)

    return {
      imgs,
      projectPath,
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
    return Config
  }

  /* ---------- copy image to clipboard --------- */
  async copyImage(imgPath: string) {
    const cb = await getClipboard()
    return await cb.copy(imgPath)
  }

  /* ---------------- paste image --------------- */
  async pasteImage(dest: string) {
    const cb = await getClipboard()
    return await cb.paste({ cwd: dest })
  }
}

export const messageHandler = new MessageHandler()
