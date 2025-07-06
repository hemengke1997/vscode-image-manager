import type { CompressionOptions } from '~/core/operator/compressor/type'
import type { FormatConverterOptions } from '~/core/operator/format-converter'
import { atom } from 'jotai'

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

export const GlobalAtoms = {
  /* ------------- image compressor ------------ */
  compressorAtom: atom<WebviewCompressorType>(),
  /* ---------- image format converter ---------- */
  formatConverterAtom: atom<WebviewFormatConverterType>(),
  /* ---------- image placeholder size ---------- */
  imagePlaceholderSizeAtom: atom<{ width: number, height: number }>(),
  /* ---------- viewer page size ---------- */
  viewerPageSizeAtom: atom<number>(0),
  /* ---------- reveal image path ---------- */
  /**
   * @note imageReveal 是带t query参数的，用于处理同一张图片的情况
   */
  imageRevealAtom: atom<string | undefined>(window.__reveal_image_path__),
  /* ----------------- sharp安装成功 ---------------- */
  sharpInstalledAtom: atom<boolean>(() => window.__sharp_installed__),
  /* ----------------- dir reveal ----------------- */
  dirRevealAtom: atom<string>(''),
  /* ------------- 工作区中可见图片列表 ------------ */
  workspaceImagesAtom: atom<{ workspaceFolder: string, images: ImageType[] }[]>([]),
  /* ------------ 图片sticky header的高度 ------------ */
  viewerHeaderStickyHeightAtom: atom<number>(0),
  /* ------------------ 插件最新信息 ------------------ */
  extLatestInfoAtom: atom<{ version: string, author: string } | null>(null),
}
