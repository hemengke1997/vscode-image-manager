import type { PluginOption } from 'vite'
import fs from 'fs-extra'
import mime from 'mime/lite'
import { toBase64 } from '../src/utils/node/image-type'

export function base64(): PluginOption {
  return {
    name: 'vite-plugin-base64',
    enforce: 'pre',
    async load(id: string) {
      const [path, query] = id.split('?')

      if (query !== 'base64' || !path) return null

      const data = await fs.readFile(path)
      const type = mime.getType(path) || 'application/octet-stream'
      const src = toBase64(type, data)

      return `export default '${src}';`
    },
  }
}
