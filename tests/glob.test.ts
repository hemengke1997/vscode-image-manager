import path from 'node:path'
import fg from 'fast-glob'
import { describe, expect, it } from 'vitest'
import { slashPath } from '~/utils'
import { convertPatternToGlob, imageGlob } from '~/utils/node/glob'

type Config = Parameters<typeof imageGlob>[0]
const workspaceFolder = path.resolve(__dirname, './fixture')

async function glob(pattern: string[], cwd?: string) {
  return await fg(pattern, {
    cwd: slashPath(cwd || process.cwd()),
    objectMode: false,
    dot: false,
    absolute: true,
    markDirectories: true,
  })
}

describe('glob images', () => {
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
      cwds: [workspaceFolder],
    }
    const { allImagePatterns } = imageGlob(config)
    const images = await glob(allImagePatterns, config.cwds[0])
    expect(images.every(t => !t.includes('dist'))).toBe(true)
  })

  it('should not ignore dist-1', async () => {
    const config: Config = {
      scan: ['png', 'jpg', 'svg'],
      cwds: [workspaceFolder],
      exclude: [...defaultExclude],
    }
    const { allImagePatterns } = imageGlob(config)
    const images = await glob(allImagePatterns, config.cwds[0])

    expect(images.some(t => t.includes('dist-1'))).toBe(true)
  })

  it('should ignore png by `scan`', async () => {
    const config: Config = {
      scan: ['jpg', 'svg'],
      exclude: ['dist-1', ...defaultExclude],
      cwds: [workspaceFolder],
    }
    const { allImagePatterns } = imageGlob(config)
    const images = await glob(allImagePatterns, config.cwds[0])

    expect(images.every(t => !t.includes('.png'))).toBe(true)
  })

  it('should ignore png by `exclude`', async () => {
    const config: Config = {
      scan: ['jpg', 'svg', 'png'],
      exclude: ['**/*.png', ...defaultExclude],
      cwds: [workspaceFolder],
    }
    const { allImagePatterns } = imageGlob(config)
    const images = await glob(allImagePatterns, config.cwds[0])

    expect(images.every(t => !t.includes('.png'))).toBe(true)
  })

  it('should convert patterns to valid glob', () => {
    expect(convertPatternToGlob(['**/*.png', '**/*.jpg', 'test', 'test/a', 'src/a.png'])).toMatchInlineSnapshot(`
      [
        "**/*.png",
        "**/*.jpg",
        "test/**",
        "test/a/**",
        "src/a.png",
      ]
    `)
  })
})
