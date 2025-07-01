import type { InlineConfig } from 'vitest/node'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import jotaiDebugLabel from 'jotai/babel/plugin-debug-label'
import jotaiReactRefresh from 'jotai/babel/plugin-react-refresh'
import { defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import { i18nAlly } from 'vite-plugin-i18n-ally'
import json5 from 'vite-plugin-json5'
import { plugin as markdown, Mode } from 'vite-plugin-markdown'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'
import { DEV_PORT } from './src/meta'
import { base64 } from './vite/base64'
import { chunkReadable } from './vite/chunk-readable'
import { clean } from './vite/clean'
import { logBuildTime } from './vite/log-build-time'
import { optimizeDeps } from './vite/optimized-deps'
import { prefetch } from './vite/prefetch'
import { preloadHelper } from './vite/preload-helper'
import { restrictImages } from './vite/restrict-images'
import { visualizer } from './vite/visualizer'

export default defineConfig((env) => {
  return {
    env,
    optimizeDeps: {
      // force: true,
    },
    server: {
      host: '0.0.0.0',
      port: DEV_PORT,
      watch: {},
      hmr: {
        host: 'localhost',
        protocol: 'ws',
      },
      headers: {
        'access-control-allow-origin': '*',
      },
      cors: {
        origin: '*',
      },
    },
    envPrefix: 'IM_',
    preview: {
      host: '0.0.0.0',
      port: DEV_PORT,
    },
    plugins: [
      react({ babel: { plugins: [jotaiDebugLabel, jotaiReactRefresh] } }),
      createHtmlPlugin({
        entry: '/src/webview/image-manager/main.tsx',
        // relative path to root
        template: './src/webview/image-manager/index.html',
        minify: env.command === 'build',
      }),
      i18nAlly({
        root: __dirname,
        localesPaths: [path.resolve(__dirname, './src/webview/image-manager/locales')],
      }),
      markdown({ mode: [Mode.MARKDOWN] }),
      svgr({ svgrOptions: { icon: true } }),
      visualizer(),
      tsconfigPaths(),
      json5(),
      preloadHelper(),
      optimizeDeps(),
      base64(),
      clean(),
      prefetch({ exclude: ['virtual_i18n-ally'] }),
      chunkReadable(),
      logBuildTime(env),
      restrictImages(),
    ],
    build: {
      outDir: path.resolve(__dirname, './dist-webview/'),
      assetsDir: 'assets',
      emptyOutDir: true,
      rollupOptions: {
        treeshake: true,
      },
      target: 'es2020',
      minify: 'esbuild',
      chunkSizeWarningLimit: 2048,
      sourcemap: false,
      reportCompressedSize: false,
    },
    test: {
      include: ['./tests/**/*.test.ts'],
    } as InlineConfig,
  }
})
