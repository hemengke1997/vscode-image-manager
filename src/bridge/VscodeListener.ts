import { getProjectPath } from '@root/helper/utils'
import fg from 'fast-glob'
import imageSize from 'image-size'
import path from 'node:path'
import { Uri, type Webview } from 'vscode'

class WebviewMessageListener {
  private readonly _imgTypes = ['svg', 'png', 'jpeg', 'jpg', 'ico', 'gif', 'webp', 'bmp', 'tif', 'apng']

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

  async _searchImgs(basePath: string, webview: Webview, fileTypes: Set<string>, dirs: Set<string>) {
    // TODO: user custom search path
    const imgs = await fg([`**/*.{${this._imgTypes.join(',')}}`], {
      cwd: basePath,
      objectMode: true,
      dot: false,
      absolute: true,
      markDirectories: true,
      stats: true,
      // TODO: get from user vscode config
      ignore: [
        '**/node_modules/**',
        '**/.git/**',
        '**/public/**',
        '**/dist/**',
        '**/build/**',
        '**/out/**',
        '**/coverage/**',
        '**/.next/**',
        '**/.nuxt/**',
        '**/.vercel/**',
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
}

export const webviewMessageListener = new WebviewMessageListener()
