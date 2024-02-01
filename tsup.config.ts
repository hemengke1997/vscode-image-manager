import fs from 'fs-extra'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { type Options, defineConfig } from 'tsup'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function buildExternals(option: Options): Options[] {
  function pathToHash(path: string) {
    return createHash('md5').update(path).digest('hex').slice(0, 8)
  }

  function copyJsonFile(root: string, source: string, target: string, fileName: string) {
    const sourcePath = path.resolve(root, source, fileName)
    const targetPath = path.resolve(root, target, fileName)
    fs.ensureDirSync(path.dirname(targetPath))
    fs.copyFileSync(sourcePath, targetPath)
  }

  return [
    {
      entry: {
        'lib/install/sharp': 'lib/install/sharp.ts',
        'lib/install/prebuild-install-bin': 'lib/install/prebuild-install-bin.ts',
        'lib/install/dll-copy': 'lib/install/dll-copy.ts',
        'lib/install/use-libvips': 'lib/install/use-libvips.ts',
      },
      format: ['cjs'],
      minify: !option.watch,
      esbuildPlugins: [
        {
          name: 'resolve-relative-packagejson',
          setup(build) {
            build.onLoad({ filter: /\.js$/ }, async (args) => {
              const SEARCH_FILES = ['prebuild-install/bin.js', 'napi-build-utils/index.js']
              if (SEARCH_FILES.some((item) => args.path.includes(item))) {
                const SEARCH_RESOLVE_JSON =
                  /(^[\w\W]*path\.resolve\s*\(\s*['"`]\s*)(package\.json)(\s*['"`]\s*\)[\w\W]*$)/
                const SEARCH_EXISTS_JSJON =
                  /(^[\w\W]*fs\.existsSync\s*\(\s*['"`]\s*)(package\.json)(\s*['"`]\s*\)[\w\W]*$)/

                const matchTarget = [SEARCH_RESOLVE_JSON, SEARCH_EXISTS_JSJON]

                const sharp = path.resolve(__dirname, 'node_modules/sharp/package.json')
                const jsonFolder = path.resolve(__dirname, 'dist/lib/json')

                let code = fs.readFileSync(args.path, 'utf8')
                for (const match of matchTarget) {
                  const res = code.match(match)
                  if (!res) {
                    continue
                  }
                  const fileName = path.basename(sharp)
                  const folderName = pathToHash(sharp)
                  copyJsonFile(__dirname, path.dirname(sharp), path.join(jsonFolder, folderName), fileName)
                  code = `${res[1]}json/${folderName}/${fileName}${res[3]}`
                }

                return {
                  contents: code,
                }
              }
            })
          },
        },
      ],
    },
  ]
}

export default defineConfig((option) => [
  {
    entry: ['src/extension.ts'],
    format: ['cjs'],
    external: ['vscode', 'tinify'],
    clean: false,
    dts: false,
    minify: !option.watch,
  },
  ...buildExternals(option),
])
