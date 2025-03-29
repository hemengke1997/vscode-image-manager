import { describe, expect, it } from 'vitest'
import { initEnv, readOptimizeDepsFile } from '~root/vite/optimized-deps'

describe('vite-plugin-optimized-deps', () => {
  it('should init env', () => {
    const filepath = initEnv()
    expect(process.env.VITE_OPTIMIZE_DEPS_FILE).toBe(filepath)
  })

  it('should read optimize deps file', async () => {
    const filepath = initEnv()
    const deps = await readOptimizeDepsFile(filepath)
    expect(deps).length.greaterThan(0)
  })
})
