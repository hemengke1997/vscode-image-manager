import type { PluginContext } from 'rollup'
import type { PluginOption } from 'vite'

export type RestrictImagesOptions = {
  imageExtensions?: string[]
  allowedExtensions?: string[]
  level?: 'error' | 'warn'
}

/**
 * 限制图片导入类型，只允许指定类型的图片导入
 * 如果开启，默认只允许导入 .webp 和 .svg 类型的图片
 * 也可传入 allowedExtensions 来指定允许导入的图片类型
 */
export function restrictImages(options?: RestrictImagesOptions): PluginOption {
  let { allowedExtensions, level = 'error', imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'] } = options || {}

  if (!allowedExtensions || allowedExtensions.length === 0) {
    allowedExtensions = ['.webp', '.svg']
  }

  const checkExtension = (ctx: PluginContext, id: string) => {
    const extension = id.slice(id.lastIndexOf('.'))
    if (!imageExtensions.includes(extension)) {
      return
    }

    if (!allowedExtensions.includes(extension)) {
      const msg = `[vite-plugin-restrict-images]: Only ${allowedExtensions.join(', ')} images are allowed. Found: ${id}`
      if (level === 'warn') {
        ctx.warn(msg)
      }
      else {
        ctx.error(msg)
      }
    }
  }

  return {
    name: 'vite-plugin-restrict-images',
    enforce: 'pre',
    load(id) {
      checkExtension(this, id)
    },
    transform(code, id) {
      if (id.endsWith('.css')) {
        const urlRegex = /url\(['"]?([^'")]+)['"]?\)/g
        const matches = code.matchAll(urlRegex)
        for (const match of matches) {
          checkExtension(this, match[1])
        }
        return code
      }
    },
  }
}
