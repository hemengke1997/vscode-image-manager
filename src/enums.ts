export enum Theme {
  dark = 'dark',
  light = 'light',
  auto = 'auto',
}

export enum Language {
  en = 'en',
  zh_CN = 'zh-CN',
  zh_TW = 'zh-TW',
  ja = 'ja',
  auto = 'auto',
}

export enum ReduceMotion {
  auto = 'auto',
  on = 'on',
  off = 'off',
}

/**
 * 根据以下属性来筛选图片visible
 */
export enum ImageVisibleFilter {
  /**
   * 图片类型 (如 png, jpg, gif)
   */
  file_type = 'file_type',
  /**
   * 图片体积 (如 1kb)
   */
  size = 'size',
  /**
   * 图片是否 git staged
   */
  git_staged = 'git_staged',
  /**
   * 图片是是否已压缩
   */
  compressed = 'compressed',
}
