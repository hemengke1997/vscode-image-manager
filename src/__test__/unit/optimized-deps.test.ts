import { describe, expect, it } from 'vitest'
import { initEnv } from '~root/vite/optimized-deps'

describe('vite-plugin-optimized-deps', () => {
  it('should init env', () => {
    const filepath = initEnv()
    expect(process.env.VITE_OPTIMIZE_DEPS_FILE).toBe(filepath)
  })

  it('should read optimize deps file', async () => {
    const filepath = initEnv()
    const content = await import('fs-extra').then((fs) => fs.readFile(filepath, 'utf-8'))
    const deps = content
      .split('\n')
      .filter(Boolean)
      .map((dep) => dep.trim())
    expect(deps).length.greaterThan(0)
  })
})
