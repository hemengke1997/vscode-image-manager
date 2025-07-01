import type { PluginOption } from 'vite'
import path from 'node:path'
import { isArray, isObject } from 'es-toolkit/compat'

// make chunk file name more readable
export function chunkReadable(): PluginOption {
  return [
    {
      name: 'vite-chunk-readable',
      config(config) {
        const output = config.build?.rollupOptions?.output
        if (!output || (isObject(output) && !isArray(output) && !output.chunkFileNames)) {
          const { assetsDir } = config.build || {}

          return {
            build: {
              rollupOptions: {
                output: {
                  chunkFileNames(chunkInfo) {
                    if (chunkInfo.facadeModuleId) {
                      const pageChunkNames = ['index']

                      for (const chunk of pageChunkNames) {
                        const regex = new RegExp(`(?:^|_)${chunk}(?=\\.|$)`)
                        const result = chunkInfo.name.match(regex)
                        if (result) {
                          const parentDir = path.basename(path.dirname(chunkInfo.facadeModuleId))

                          const name = chunkInfo.name.replace(regex, parentDir)

                          if (parentDir) {
                            return `${assetsDir}/js/${name}.[hash].js`
                          }
                        }
                      }
                    }
                    return `${assetsDir}/js/[name].[hash].js`
                  },
                  entryFileNames: `${assetsDir}/js/[name].[hash].js`,
                  assetFileNames: (assetInfo) => {
                    const extType = assetInfo.name
                    if (extType && /css/i.test(extType)) {
                      return `${assetsDir}/css/[name].[hash][extname]`
                    }
                    return `${assetsDir}/static/[name].[hash][extname]`
                  },
                },
              },
            },
            worker: {
              rollupOptions: {
                output: {
                  entryFileNames() {
                    return `${assetsDir}/js/worker/[name].[hash].js`
                  },
                  assetFileNames() {
                    return `${assetsDir}/js/worker/[name].[hash].js`
                  },
                },
              },
            },
          }
        }
      },
    },
  ]
}
