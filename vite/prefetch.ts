import type { OutputAsset, OutputChunk } from 'rollup'
import type { PluginOption, ResolvedConfig } from 'vite'

export function prefetch(options?: { exclude: string[] }): PluginOption {
  const { exclude = [] } = options || {}
  let config: ResolvedConfig
  return {
    name: 'vite-plugin-bundle-prefetch',
    apply: 'build',
    configResolved(c: ResolvedConfig) {
      config = c
    },
    transformIndexHtml(html, ctx) {
      const bundleEntries = ctx.bundle ?? {}

      const prefetchBundles = Object.keys(bundleEntries).filter((bundle) => {
        const current = bundleEntries[bundle]

        if (bundle.endsWith('.map') || !current) {
          return false
        }
        if ((current as OutputChunk).isDynamicEntry) {
          return true
        }
        if ((current as OutputAsset).type === 'asset' && current.fileName.endsWith('.css')) {
          return true
        }

        return false
      })

      const prefechBundlesString = prefetchBundles.filter(
        bundle => !html.includes(bundle) && exclude.every(exclusion => !bundle.includes(exclusion)),
      )

      return {
        html,
        tags: prefechBundlesString.map(bundle => ({
          tag: 'link',
          attrs: {
            rel: 'prefetch',
            href: `${config.base}${bundle}`,
            fetchpriority: 'high',
            as: (() => {
              const ext = bundle.split('.').pop()
              switch (ext) {
                case 'js':
                  return 'script'
                case 'css':
                  return 'style'
                default:
                  return 'fetch'
              }
            })(),
          },
          injectTo: 'head',
        })),
      }
    },
  }
}
