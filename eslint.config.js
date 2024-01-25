import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

const { defineConfig } = require('@minko-fe/eslint-config')
export default defineConfig([
  {
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      'no-restricted-syntax': 'off',
    },
  },
])
