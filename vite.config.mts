/// <reference types="vitest/config" />

import path from 'node:path'
import { defineConfig } from 'vite'
import { preset } from 'vite-config-preset'
import { createHtmlPlugin } from 'vite-plugin-html'
import { i18nAlly } from 'vite-plugin-i18n-ally'
import { plugin as markdown, Mode } from 'vite-plugin-markdown'
import { type InlineConfig } from 'vitest/node'
import { DEV_PORT } from './src/meta'
import { optimizeDeps } from './vite/optimized-deps'
import { preloadHelper } from './vite/preload-helper'

export default defineConfig(async (env) => {
  return preset({
    env,
    server: {
      host: '0.0.0.0',
      port: DEV_PORT,
      watch: {},
      hmr: {
        host: 'localhost',
        protocol: 'ws',
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
      createHtmlPlugin({
        entry: path.resolve(__dirname, './src/webview/image-manager/main.tsx'),
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
      include: ['**/__test__/**/*.test.ts'],
    } as InlineConfig,
  })
})
