import { defineConfig } from 'taze'

export default defineConfig({
  exclude: ['@types/node', '@types/vscode', 'svgo', 'tar-fs', '@types/tar-fs', 'execa'],
  force: true,
  write: true,
  install: true,
  interactive: true,
  depFields: {
    overrides: false,
  },
})
