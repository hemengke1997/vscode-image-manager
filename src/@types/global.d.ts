import type SharpNS from 'sharp'
import { type Stats } from 'fs-extra'
import { type ParsedPath } from 'node:path'
import { type ReactElement } from 'react'

declare global {
  type Theme = 'dark' | 'light' | 'auto'
  type Language = 'en' | 'zh-CN' | 'auto'
  type ReduceMotion = 'auto' | 'on' | 'off'

  type TSharp = typeof SharpNS

  interface Window {
    /**
     * 挂载app
     * @param reload 为 true 则刷新app
     */
    mountApp: (reload?: boolean) => void

    /**
     * vscode 设置到window上的全局变量
     */
    __target_image_path__: string
  }

  // The visible of image is determined by 'visible' prop.
  // at present, there are following filetr condition
  // 1. type - image type (i.e png, jpg, gif)
  // 2. size - image size (i.e 1kb)
  // 3. git-staged - whether the image is git staged
  // 4. compressed - whether the image is compressed
  type ImageVisibleFilterType = 'file_type' | 'size' | 'git_staged' | 'compressed'

  /**
   * 全局图片类型
   */
  type ImageType = {
    // 来自vscode的属性

    /**
     * 图片名称
     */
    name: string
    /**
     * 图片绝对路径
     */
    path: string
    /**
     * fs.stat 的返回
     */
    stats: Stats
    /**
     * path.dirname(cwd) 项目绝对路径
     */
    basePath: string
    /**
     * 目录相对工作区路径
     */
    dirPath: string
    /**
     * path.dirname(image.path) 目录绝对路径
     */
    absDirPath: string
    /**
     * 文件类型
     */
    fileType: string
    /**
     * webview.asWebviewUri(Uri.file(image.path)).toString()
     */
    vscodePath: string
    /**
     * path.basename(cwd) 工作区名称
     */
    workspaceFolder: string
    /**
     * cwd 工作区绝对路径
     */
    absWorkspaceFolder: string
    /**
     * 图片相对于工作区或项目的路径（如果有多个工作区，则相对于项目）
     */
    relativePath: string
    /**
     * path.parse(image.path) 的返回
     */
    extraPathInfo: ParsedPath
  } & {
    // 应用在webview的额外属性

    // image visible
    visible?: Partial<Record<ImageVisibleFilterType | string, boolean>>
    // image name for display
    nameElement?: ReactElement
  }
}

export { SharpNS }
