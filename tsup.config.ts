import { type Options, defineConfig } from 'tsup'

function buildExternals(option: Options): Options[] {
  return [
    {
      entry: {
        'lib/install/sharp': 'lib/install/sharp.ts',
        'lib/install/check': 'lib/install/check.ts',
      },
      format: ['cjs'],
      minify: !option.watch,
    },
  ]
}

export default defineConfig((option) => [
  {
    entry: ['src/extension.ts'],
    format: ['cjs'],
    external: ['vscode'],
    clean: false,
    dts: false,
    minify: !option.watch,
    target: 'es2015',
  },
  ...buildExternals(option),
])
