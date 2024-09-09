import fg from 'fast-glob'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { normalizePath } from '~/utils'
import { imageGlob } from '~/utils/glob'

type Config = Parameters<typeof imageGlob>[0]
const workspaceFolder = path.resolve(__dirname, './fixture')

async function glob(pattern: string[], cwd?: string) {
  return await fg(pattern, {
    cwd: normalizePath(cwd || process.cwd()),
    objectMode: false,
    dot: false,
    absolute: true,
    markDirectories: true,
  })
}

describe('Glob images', () => {
  const defaultExclude = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/coverage/**',
    '**/.next/**',
    '**/.nuxt/**',
    '**/.vercel/**',
    '**/.idea/**',
  ]
  it('should ignore dist-1', async () => {
    const config: Config = {
      scan: ['png', 'jpg', 'svg'],
      exclude: ['dist-1', ...defaultExclude],
      root: [workspaceFolder],
      cwd: workspaceFolder,
    }
    const { allImagePatterns } = imageGlob(config)
    const images = await glob(allImagePatterns, config.cwd)
    expect(images.every((t) => !t.includes('dist'))).toBe(true)
  })

  it('should not ignore dist-1', async () => {
    const config: Config = {
      scan: ['png', 'jpg', 'svg'],
      root: [workspaceFolder],
      cwd: workspaceFolder,
      exclude: [...defaultExclude],
    }
    const { allImagePatterns } = imageGlob(config)
    const images = await glob(allImagePatterns, config.cwd)

    expect(images.some((t) => t.includes('dist-1'))).toBe(true)
  })

  it('should ignore png by `scan`', async () => {
    const config: Config = {
      scan: ['jpg', 'svg'],
      exclude: ['dist-1', ...defaultExclude],
      root: [workspaceFolder],
      cwd: workspaceFolder,
    }
    const { allImagePatterns } = imageGlob(config)
    const images = await glob(allImagePatterns, config.cwd)

    expect(images.every((t) => !t.includes('.png'))).toBe(true)
  })

  it('should ignore png by `exclude`', async () => {
    const config: Config = {
      scan: ['jpg', 'svg', 'png'],
      exclude: ['**/*.png', ...defaultExclude],
      root: [workspaceFolder],
      cwd: workspaceFolder,
    }
    const { allImagePatterns } = imageGlob(config)
    const images = await glob(allImagePatterns, config.cwd)

    expect(images.every((t) => !t.includes('.png'))).toBe(true)
  })
})
