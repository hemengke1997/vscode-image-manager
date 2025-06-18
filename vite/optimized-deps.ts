import type { PluginOption } from 'vite'
import path from 'node:path'
import process from 'node:process'
import fs from 'fs-extra'

export function initEnv() {
  const filepath = 'vite/optimized-deps.txt'
  process.env.VITE_OPTIMIZE_DEPS_FILE = filepath
  return filepath
}

export async function readOptimizeDepsFile(filepath: string) {
  const content = await fs.readFile(path.resolve(process.cwd(), filepath), 'utf-8')
  const deps = content
    .split('\n')
    .filter(Boolean)
    .map(dep => dep.trim())

  return deps || []
}

export function optimizeDeps(): PluginOption {
  return {
    name: 'vite:optimize-deps',
    apply: 'serve',
    enforce: 'pre',
    async config() {
      const filepath = initEnv()
      const deps = await readOptimizeDepsFile(filepath)

      return {
        optimizeDeps: {
          include: [...deps, 'image-manager/hooks/**', 'react-icons/**'],
        },
      }
    },
  }
}
