import path from 'node:path'
import { defineConfig } from 'vite'
import { preset } from 'vite-config-preset'

// https://vitejs.dev/config/
export default defineConfig((env) => {
  return preset(
    {
      env,
      css: {
        postcss: path.join(__dirname, './postcss.config.js'),
      },
    },
    {
      splitVendorChunk: false,
    },
  )
})
