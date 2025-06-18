import { describe, expect, it } from 'vitest'
import { matchPreloadHelper, replacePreloadHelper } from '~root/vite/preload-helper'

const preloadHelperJs = 'const scriptRel = \'modulepreload\';const assetsURL = function(dep) { return "/"+dep };const seen = {};export const __vitePreload'

describe('vite-plugin-preload-helper', () => {
  it('should regex match', () => {
    expect(matchPreloadHelper(preloadHelperJs)).toHaveLength(1)
  })

  it('should regex match with empty string', () => {
    expect(matchPreloadHelper('xxxx')).toBeNull()
  })

  it('should replace preload-helper', () => {
    const match = matchPreloadHelper(preloadHelperJs)

    expect(replacePreloadHelper(preloadHelperJs, match!).toString()).toMatchInlineSnapshot(
      '"const scriptRel = \'modulepreload\';const assetsURL = function(dep) { return window.__vscode_preload_url__+"/"+dep };const seen = {};export const __vitePreload"',
    )
  })
})
