import path from 'node:path'
import { defineConfig, loadConfigFromFile, mergeConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import { i18nDetector } from 'vite-plugin-i18n-detector'

export default defineConfig(async (env) => {
  const loadResult = await loadConfigFromFile(env, path.resolve(__dirname, './src/webview/ui-framework/vite.config.ts'))

  const config = defineConfig({
    resolve: {
      alias: {
        '@root': path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      createHtmlPlugin({
        entry: path.resolve(__dirname, './src/webview/index.tsx'),
        minify: false,
      }),
      i18nDetector({
        root: __dirname,
        autoDetectI18nConfig: true,
      }),
    ],
    build: {
      outDir: path.resolve(__dirname, './dist-webview/'),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].js`,
          chunkFileNames: `assets/[name].js`,
          assetFileNames: `assets/[name].[ext]`,
        },
      },
      minify: false,
    },
    server: {
      watch: {},
      hmr: {
        host: 'localhost',
        protocol: 'ws',
      },
    },
  })

  return mergeConfig(loadResult!.config, config)
})
