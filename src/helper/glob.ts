import { Context } from '@rootSrc/Context'
import { addLastSlash } from './utils'

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
  '**/build/**',
  '**/out/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/.vercel/**',
]

export function globImages() {
  const { imageType, exclude, root } = Context.getInstance().config

  const pattern = `**/*.{${imageType.join(',')}}`

  const patterns = root.map((r) => `${addLastSlash(r)}${pattern}`)

  const ignore = [...exclude, ...BUILT_IN_EXCLUDE].map((pattern) => {
    if (isPositivePattern(pattern)) {
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
