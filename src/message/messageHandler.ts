import { Config } from '@root/config'
import { getProjectPath } from '@root/helper/utils'
import fg from 'fast-glob'
import imageSize from 'image-size'
import path from 'node:path'
import { Uri, type Webview } from 'vscode'

class MessageHandler {
  private readonly _imgTypes = ['svg', 'png', 'jpeg', 'jpg', 'ico', 'gif', 'webp', 'bmp', 'tif', 'apng']

  /* ------------------- 获取图片 ------------------- */
  private async _searchImgs(basePath: string, webview: Webview, fileTypes: Set<string>, dirs: Set<string>) {
    const imgs = await fg([`**/*.{${this._imgTypes.join(',')}}`], {
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
        ...Config.excludePath,
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

  /* ------------------ 获取图片尺寸 ------------------ */
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

  /* ------------ 获取extension config ------------ */
  getExtConfig() {
    return Config
  }
}

export const messageHandler = new MessageHandler()
