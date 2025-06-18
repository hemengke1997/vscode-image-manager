import type { Stats } from 'fs-extra'
import type { ReactElement } from 'react'
import type SharpNS from 'sharp'
import type {
  Compressed as CompressedEnum,
  Language as LanguageEnum,
  ReduceMotion as ReduceMotionEnum,
  Theme as ThemeEnum,
} from '~/meta'
import type { ImageVisibleFilter } from '~/webview/image-manager/hooks/use-image-filter/image-filter'

declare global {
  type TSharp = typeof SharpNS

  type Theme = ThemeEnum

  type Language = LanguageEnum

  type ReduceMotion = ReduceMotionEnum

  type Metadata = Pick<SharpNS.Metadata, 'width' | 'height'>

  interface Window {
    /**
     * 挂载app
     * @param reload 为 true 则刷新app
     */
    mountApp: (reload?: boolean) => void
    /**
     * react root
     */
    __react_root__: ReactDOM.Root

    /**
     * vscode 设置到window上的全局变量
     */
    __reveal_image_path__: string
    __sharp_installed__: boolean
  }

  /**
   * 全局图片类型
   */
  type ImageType = {
    /**
     * 来自vscode的属性
     */

    /**
     * 图片全称
     * @example pic.png
     */
    basename: string
    /**
     * 图片名
     * @example xxx
     */
    name: string
    /**
     * 文件类型
     * @example png
     */
    extname: string
    /**
     * 图片绝对路径
     * @example /Users/xxx/xxx/xxx.png
     */
    path: string
    /**
     * fs.stat 部分返回
     */
    stats: Pick<Stats, 'mtimeMs' | 'size'>
    /**
     * 目录工作区路径
     * @example dir/assets
     */
    dirPath: string
    /**
     * path.dirname(image.path) 目录绝对路径
     * @example /Users/xxx/vscode-project/dir
     */
    absDirPath: string
    /**
     * 图片相对于工作区或项目的路径（如果有多个工作区，则相对于项目）
     * @example ./dir/assets/xxx.png
     */
    relativePath: string
    /**
     * webview.asWebviewUri(Uri.file(image.path)).toString()
     * @example http://file:vscode-resource.vscode-cdn.net/Users/xxx/xxx/xxx.png
     */
    vscodePath: string
    /**
     * 唯一标识符，用于 react key
     * 图片path或vscodePath
     */
    key: string
    /**
     * path.basename(cwd) 工作区名称
     * @example app
     */
    workspaceFolder: string
    /**
     * cwd 工作区绝对路径
     * @example /Users/xxx/app
     */
    absWorkspaceFolder: string
    /**
     * 图片信息
     */
    info: {
      /**
       * 图片是否已压缩
       */
      compressed: CompressedEnum
      /**
       * 图片metadata
       */
      metadata: Metadata
      /**
       * 图片是否已git add
       */
      gitStaged: boolean
    }
  } & {
    /**
     * 应用在webview的额外属性
     * 用于展示图片信息
     * 不会在数据流通中传递，所以对内存消耗不大
     */

    /**
     * 图片 visible
     * @example
     * {
     *  git_staged: true,
     *  compressed: false,
     *  size: true,
     *  exclude_types: true,
     * }
     */
    visible?: Partial<Record<ImageVisibleFilter, boolean>>
    /**
     * 用于展示的图片名称
     */
    nameElement?: ReactElement
  }
}

export { SharpNS }
