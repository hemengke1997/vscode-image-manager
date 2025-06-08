import { execa } from 'execa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Options } from 'tsup'
import { loadEnv } from 'vite'
import logger from '~/utils/logger'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function buildExternals(option: Options): Options[] {
  return [
    {
      entry: ['lib/sharp/index.ts'],
      outDir: 'dist/lib/sharp',
      format: ['cjs'],
      target: 'node18',
      minify: !option.watch,
    },
  ]
}

export default defineConfig((option) => [
  {
    entry: ['src/extension.ts'],
    format: 'cjs',
    external: ['vscode', 'sharp'],
    noExternal: ['sharp/package.json', /sharp\/lib\/libvips/],
    clean: !option.watch,
    dts: false,
    target: 'node18',
    minify: !option.watch,
    env: {
      NODE_ENV: option.watch ? 'development' : process.env.NODE_ENV || 'production',
      ...loadEnv('', __dirname, 'IM_'),
    },
    onSuccess() {
      execa('npm', ['run', 'build:i18n'])
      logger.success('i18n build success')
      return Promise.resolve()
    },
  },
  ...buildExternals(option),
])
