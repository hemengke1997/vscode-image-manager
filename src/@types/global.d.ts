import type SharpNS from '@minko-fe/sharp'
import { type Stats } from 'fs-extra'
import { type ParsedPath } from 'node:path'
import { type ReactElement } from 'react'
import {
  type ImageVisibleFilter as ImageVisibleFilterEnum,
  type Language as LanguageEnum,
  type ReduceMotion as ReduceMotionEnum,
  type Theme as ThemeEnum,
} from '~/enums'

declare global {
  type TSharp = typeof SharpNS

  type Theme = ThemeEnum

  type Language = LanguageEnum

  type ReduceMotion = ReduceMotionEnum

  type ImageVisibleFilterType = ImageVisibleFilterEnum

  interface Window {
    /**
     * 挂载app
     * @param reload 为 true 则刷新app
     */
    mountApp: (reload?: boolean) => void

    /**
     * vscode 设置到window上的全局变量
     */
    __reveal_image_path__: string
  }

  /**
   * 全局图片类型
   */
  type ImageType = {
    /**
     * 来自vscode的属性
     */

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
    /**
     * 应用在webview的额外属性
     */

    /**
     * 图片 visible
     */
    visible?: Partial<Record<ImageVisibleFilterType | string, boolean>>
    /**
     * 用于展示的图片名称
     */
    nameElement?: ReactElement
  }
}

export { SharpNS }
