import { useState } from 'react'
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
  const [imageReveal, setImageReveal] = useState<string | undefined>(window.__reveal_image_path__)

  /**
   * sharp安装成功
   */
  const [sharpInstalled] = useState<boolean>(window.__sharp_installed__)

  /* ----------------- dir reveal ----------------- */
  const [dirReveal, setDirReveal] = useState<string>('')

  /* ------------- 工作区中可见图片列表 ------------ */
  const [workspaceImages, setWorkspaceImages] = useState<{ workspaceFolder: string; images: ImageType[] }[]>([])

  /* ------------ 图片sticky header的高度 ------------ */
  const [viewerHeaderStickyHeight, setViewerHeaderStickyHeight] = useState<number>(0)

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
    imageWidth,
    setImageWidth,
    imagePlaceholderSize,
    setImagePlaceholderSize,
    imageReveal,
    setImageReveal,
    workspaceImages,
    setWorkspaceImages,
    viewerHeaderStickyHeight,
    setViewerHeaderStickyHeight,
    dirReveal,
    setDirReveal,
    sharpInstalled,
    extLastetInfo,
    setExtLastetInfo,
  }
}

const GlobalStore = createStore(useGlobalStore)

export default GlobalStore
