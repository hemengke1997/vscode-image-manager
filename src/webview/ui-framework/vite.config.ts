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
      server: {
        host: '0.0.0.0',
        port: 4433,
      },
      preview: {
        host: '0.0.0.0',
        port: 4433,
      },
      css: {
        postcss: path.resolve(__dirname, './postcss.config.cjs'),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
    },
    {
      publicTypescript: false,
      compress: false,
      legacy: false,
    },
  )
})
