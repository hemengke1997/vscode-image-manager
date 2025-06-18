import type { PluginOption, ResolvedConfig } from 'vite'
import path from 'node:path'
import fs from 'fs-extra'

export function clean(): PluginOption {
  let config: ResolvedConfig
  return {
    name: 'clean',
    enforce: 'post',
    configResolved(c) {
      config = c
    },
    closeBundle: {
      order: 'post',
      sequential: true,
      async handler() {
        const cwd = path.resolve(config.root, config.build.outDir)
        await fs.rm(path.join(cwd, 'src'), { recursive: true, force: true })
      },
    },
  }
}
