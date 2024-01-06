import { Context } from '@rootSrc/Context'

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
  const { imageType, exclude } = Context.getInstance().config
  const patterns = `**/*.{${imageType.join(',')}}`

  const ignore = [...exclude, ...BUILT_IN_EXCLUDE].map((pattern) => {
    if (isPositivePattern(pattern)) {
      return convertToNegativePattern(pattern)
    }
    return convertToPositivePattern(pattern)
  })

  return {
    patterns,
    ignore,
    all: [patterns].concat(ignore),
  }
}
