import type { InlineConfig } from 'vitest/node'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import jotaiDebugLabel from 'jotai/babel/plugin-debug-label'
import jotaiReactRefresh from 'jotai/babel/plugin-react-refresh'
import { defineConfig } from 'vite'
import { preset } from 'vite-config-preset'
import { createHtmlPlugin } from 'vite-plugin-html'
import { i18nAlly } from 'vite-plugin-i18n-ally'
import { plugin as markdown, Mode } from 'vite-plugin-markdown'
import { DEV_PORT } from './src/meta'
import { base64 } from './vite/base64'
import { clean } from './vite/clean'
import { optimizeDeps } from './vite/optimized-deps'
import { prefetch } from './vite/prefetch'
import { preloadHelper } from './vite/preload-helper'

export default defineConfig(async (env) => {
  return preset(
    {
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
        preloadHelper(),
        optimizeDeps(),
        base64(),
        clean(),
        prefetch({ exclude: ['virtual_i18n-ally'] }),
      ],
      build: {
        outDir: path.resolve(__dirname, './dist-webview/'),
        emptyOutDir: true,
        minify: true,
        rollupOptions: {
          treeshake: true,
        },
        target: 'es2020',
      },
      test: {
        include: ['./tests/**/*.test.ts'],
      } as InlineConfig,
    },
    {
      react: false,
    },
  )
})
