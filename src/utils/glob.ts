//  function removeLastSlash(path: string) {
//   return path.replace(/\/$/g, '')
// }

import { normalizePath } from '.'

function addLastSlash(path: string) {
  return path.replace(/\/?$/g, '/')
}

export type Pattern = string

function isNegativePattern(pattern: Pattern): boolean {
  return pattern.startsWith('!') && pattern[1] !== '('
}

function isPositivePattern(pattern: Pattern): boolean {
  return !isNegativePattern(pattern)
}

function convertToPositivePattern(pattern: Pattern): Pattern {
  return isNegativePattern(pattern) ? pattern.slice(1) : pattern
}

function convertToNegativePattern(pattern: Pattern): Pattern {
  return `!${pattern}`
}

const BUILT_IN_EXCLUDE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/.vercel/**',
]

export function imageGlob(options: { imageType: string[]; exclude: string[]; root: string[]; cwd?: string }) {
  const { imageType, exclude, root, cwd } = options

  const pattern = `**/*.{${imageType.join(',')}}`

  let patterns = cwd ? [`${addLastSlash(cwd)}${pattern}`] : root.map((r) => `${addLastSlash(r)}${pattern}`)
  patterns = patterns.map((p) => normalizePath(p))

  const ignore = [...exclude, ...BUILT_IN_EXCLUDE].map((pattern) => {
    if (isPositivePattern(pattern)) {
      if (!pattern.startsWith('*')) {
        return convertToNegativePattern(`**/${pattern}`)
      }
      return convertToNegativePattern(pattern)
    }
    return convertToPositivePattern(pattern)
  })

  return {
    pattern,
    patterns,
    ignore,
    all: patterns.concat(ignore),
  }
}
