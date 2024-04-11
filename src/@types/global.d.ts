import type SharpNS from 'sharp'
import { type Stats } from 'fs-extra'
import { type ParsedPath } from 'node:path'
import { type ReactElement } from 'react'

declare global {
  type Theme = 'dark' | 'light' | 'auto'
  type Language = 'en' | 'zh-CN' | 'auto'

  type TSharp = typeof SharpNS

  interface Window {
    __react_root__: ReactDOM.Root
    mountApp: (reload?: boolean) => void
  }

  // The visible of image is determined by 'visible' prop.
  // at present, there are following filetr condition
  // 1. type - image type (i.e png, jpg, gif)
  // 2. size - image size (i.e 1kb)
  // 3. git-staged - whether the image is git staged
  // 4. compressed - whether the image is compressed
  type ImageVisibleFilterType = 'file_type' | 'size' | 'git_staged' | 'compressed'
  type ImageType = {
    name: string
    path: string
    stats: Stats
    dirPath: string
    fileType: string
    vscodePath: string
    workspaceFolder: string
    absWorkspaceFolder: string
    absDirPath: string
    basePath: string
    extraPathInfo: ParsedPath
  } & {
    // extra

    // image visible
    visible?: Partial<Record<ImageVisibleFilterType | string, boolean>>
    // image name for display
    nameElement?: ReactElement
  }
}

export { SharpNS }
