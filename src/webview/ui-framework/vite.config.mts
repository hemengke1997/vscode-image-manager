import { overrideConfig } from '@minko-fe/vite-config'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig((env) => {
  return overrideConfig(
    env,
    {
      plugins: [react()],
      css: {
        postcss: path.resolve(__dirname, './postcss.config.js'),
      },
      resolve: {
        alias: [{ find: '~', replacement: path.resolve(__dirname, './src') }],
      },
    },
    {
      publicTypescript: false,
      compress: false,
      legacy: false,
      splitVendorChunk: true,
    },
  )
})
