import { defineConfig } from 'tsup'

export default defineConfig((option) => ({
  entry: ['src/extension.ts'],
  format: ['cjs'],
  shims: false,
  dts: false,
  external: ['vscode', 'sharp', 'tinify'],
  clean: false,
  minify: !option.watch,
}))
