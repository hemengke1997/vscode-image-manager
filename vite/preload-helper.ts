import MagicString from 'magic-string'
import { type PluginOption } from 'vite'
import { PRELOAD_HELPER } from '../src/meta'

export function matchPreloadHelper(code: string) {
  const regex = /assetsURL\s*=\s*function.*return\s+(?=['"`])/
  return code.match(regex)
}

export function replacePreloadHelper(code: string, match: RegExpMatchArray) {
  const start = match.index! + match[0].length

  const magicString = new MagicString(code)
  // 添加资源前缀，从本地加载资源
  magicString.appendLeft(start, `${PRELOAD_HELPER}+`)
  return magicString
}

export function preloadHelper(): PluginOption {
  return {
    name: 'vscode:preload-helper',
    apply: 'build',
    enforce: 'post',
    transform(code, id) {
      // id from vite:build-import-analysis
      if (id === '\0vite/preload-helper.js') {
        const match = matchPreloadHelper(code)

        if (match) {
          const magicString = replacePreloadHelper(code, match)
          return {
            code: magicString.toString(),
            map: null,
          }
        } else {
          console.error('preload-helper: Failed to match assetsURL function')
        }
      }
    },
  }
}
