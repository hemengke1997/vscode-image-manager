import { useMemo, useState } from 'react'
import { useSetState } from 'ahooks'
import { createStore } from 'context-state'
import { floor } from 'es-toolkit/compat'
import { ConfigKey } from '~/core/config/common'
import { type CompressionOptions } from '~/core/operator/compressor/type'
import { type FormatConverterOptions } from '~/core/operator/format-converter'
import { useExtConfigState } from '~/webview/image-manager/hooks/use-ext-config-state'
import VscodeStore from '~/webview/image-manager/stores/vscode-store'

export type WebviewCompressorType = {
  option: CompressionOptions
  limit: {
    from: string[]
    to: string[]
  }
}

export type WebviewFormatConverterType = {
  option: FormatConverterOptions
  limit: {
    from: string[]
    to: string[]
  }
}

function useGlobalStore() {
  const { extConfig, workspaceState, vscodeConfig } = VscodeStore.useStore([
    'extConfig',
    'workspaceState',
    'vscodeConfig',
  ])

  /* ------------- image compressor ------------ */
  const [compressor, setCompressor] = useState<WebviewCompressorType>()
  /* ---------- image format converter ---------- */
  const [formatConverter, setFormatConverter] = useState<WebviewFormatConverterType>()

  /* --------------- images state --------------- */
  const [imageState, setImageState] = useSetState<{
    loading: boolean
    // 所有工作区
    workspaceFolders: string[]
    workspaces: {
      images: ImageType[] // 当前工作区所有图片
      workspaceFolder: string // 当前工作区
      absWorkspaceFolder: string // 工作区绝对路径
      exts: string[] // 当前工作区所有图片类型
      dirs: string[] // 当前工作区所有目录
    }[]
  }>({
    loading: true,
    workspaceFolders: [],
    workspaces: [],
  })

  /* ---------------- image width --------------- */
  const [imageWidth, setImageWidth] = useExtConfigState(ConfigKey.viewer_imageWidth, extConfig.viewer.imageWidth, [], {
    debounce: {
      wait: 500,
    },
    // 向下取整，避免出现小数，也为了保证图片不换行
    postValue: (value) => floor(value, 0),
  })

  /* ---------- image placeholder size ---------- */
  const [imagePlaceholderSize, setImagePlaceholderSize] = useState<{ width: number; height: number }>()

  /* ---------- reveal image path ---------- */
  /**
   * @note imageReveal 是带t query参数的，用于处理同一张图片的情况
   */
  const [imageReveal, setImageReveal] = useState<string[]>([window.__reveal_image_path__])

  /**
   * sharp安装成功
   */
  const [sharpInstalled] = useState<boolean>(window.__sharp_installed__)

  /* ----------------- dir reveal ----------------- */
  const [dirReveal, setDirReveal] = useState<string>('')

  /* ------------- tree context 中的数据 ------------ */
  const [treeData, setTreeData] = useState<{ workspaceFolder: string; visibleList: ImageType[] }[]>([])

  /* ------------ 图片sticky header的高度 ------------ */
  const [viewerHeaderStickyHeight, setViewerHeaderStickyHeight] = useState<number>(0)

  /* ----------------- 项目中所有图片类型 ---------------- */
  const allImageTypes = useMemo(() => imageState.workspaces.flatMap((item) => item.exts), [imageState.workspaces])

  /* ------------------ 插件最新信息 ------------------ */
  const [extLastetInfo, setExtLastetInfo] = useState<{ version: string; author: string } | null>(null)

  return {
    vscodeConfig,
    workspaceState,
    compressor,
    setCompressor,
    formatConverter,
    setFormatConverter,
    extConfig,
    imageState,
    setImageState,
    imageWidth,
    setImageWidth,
    imagePlaceholderSize,
    setImagePlaceholderSize,
    imageReveal,
    setImageReveal,
    treeData,
    setTreeData,
    viewerHeaderStickyHeight,
    setViewerHeaderStickyHeight,
    dirReveal,
    setDirReveal,
    allImageTypes,
    sharpInstalled,
    extLastetInfo,
    setExtLastetInfo,
  }
}

const GlobalStore = createStore(useGlobalStore)

export default GlobalStore
