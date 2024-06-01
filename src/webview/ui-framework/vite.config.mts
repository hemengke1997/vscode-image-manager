import { enhanceViteConfig } from '@minko-fe/vite-config'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig((env) => {
  return enhanceViteConfig(
    {
      env,
      plugins: [react()],
      css: {
        postcss: path.join(__dirname, './postcss.config.js'),
      },
    },
    {
      legacy: false,
      splitVendorChunk: false,
    },
  )
})
