/// <reference types="vitest" />

import path from 'node:path'
import { defineConfig, loadConfigFromFile, mergeConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import { i18nAlly } from 'vite-plugin-i18n-ally'
import { DEV_PORT } from './src/meta'

export default defineConfig(async (env) => {
  const loadResult = await loadConfigFromFile(
    env,
    path.resolve(__dirname, './src/webview/ui-framework/vite.config.mts'),
  )

  const config = defineConfig({
    server: {
      host: '0.0.0.0',
      port: DEV_PORT,
      watch: {},
      hmr: {
        host: 'localhost',
        protocol: 'ws',
      },
    },
    envPrefix: 'IM_',
    preview: {
      host: '0.0.0.0',
      port: DEV_PORT,
    },
    plugins: [
      createHtmlPlugin({
        entry: path.resolve(__dirname, './src/webview/main.tsx'),
        minify: env.command === 'build',
      }),
      i18nAlly({
        root: __dirname,
        localesPaths: [path.resolve(__dirname, './src/webview/locales')],
      }),
    ],
    optimizeDeps: {
      force: true,
    },
    build: {
      outDir: path.resolve(__dirname, './dist-webview/'),
      emptyOutDir: true,
      minify: true,
      rollupOptions: {
        treeshake: true,
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]',
        },
      },
    },
    test: {
      include: ['**/__test__/**/*.test.ts'],
    },
  })

  return mergeConfig(loadResult!.config, config)
})
