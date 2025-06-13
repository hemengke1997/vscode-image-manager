import fs from 'fs-extra'
import path from 'node:path'
import { type PluginOption, type ResolvedConfig } from 'vite'

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
