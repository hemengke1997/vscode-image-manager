import type { Json5Options } from 'vite-plugin-json5'
import json5Plugin from 'vite-plugin-json5'

export function json5(options?: Json5Options) {
  return json5Plugin(options)
}
