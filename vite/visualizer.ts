import type { PluginVisualizerOptions } from 'rollup-plugin-visualizer'
import { visualizer as rollupVisualizer } from 'rollup-plugin-visualizer'

export type VisualizerOptions = Partial<PluginVisualizerOptions> & {
  enable?: boolean
}

export function visualizer(options: VisualizerOptions = {}) {
  const { enable = false, ...rest } = options

  if (enable) {
    return rollupVisualizer({
      filename: './node_modules/.cache/visualizer/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      ...rest,
    })
  }
  return null
}
