import type { ConfigEnv, PluginOption } from 'vite'
import { logTimeInfo } from 'picologger/built-in'

export function logBuildTime(configEnv: ConfigEnv): PluginOption {
  const { mode } = configEnv

  const infoStr = logTimeInfo(mode)

  return {
    name: 'vite-log-build-time',
    enforce: 'post',
    transformIndexHtml: {
      handler(html) {
        return {
          html,
          tags: [
            {
              injectTo: 'body',
              children: infoStr,
              tag: 'script',
              attrs: {
                'data-log-time': true,
              },
            },
          ],
        }
      },
    },
  }
}
