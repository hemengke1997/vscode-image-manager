import type { PluginOption } from 'vite'
import { execa } from 'execa'
import getPort from 'get-port'
import { REACT_DEVTOOLS_PORT } from '../src/meta'

export function reactDevTools(): PluginOption {
  return {
    name: 'react-devtools',
    apply: 'serve',
    async configureServer() {
      const port = await getPort({ port: REACT_DEVTOOLS_PORT })
      if (port !== REACT_DEVTOOLS_PORT) {
        // 已经有服务了
        return
      }
      execa('react-devtools')
    },
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'script',
            attrs: {
              src: `http://localhost:${REACT_DEVTOOLS_PORT}`,
            },
            injectTo: 'head-prepend',
          },
        ],
      }
    },
  }
}
