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

function convertToIgnore(patterns: string[]) {
  return patterns.map((pattern) => {
    if (isPositivePattern(pattern)) {
      if (!pattern.startsWith('*')) {
        return convertToNegativePattern(`**/${pattern}`)
      }
      return convertToNegativePattern(pattern)
    }
    return convertToPositivePattern(pattern)
  })
}

export function imageGlob(options: { scan: string[]; exclude: string[]; cwds: string[] }) {
  const { scan, exclude, cwds } = options

  const imagePattern = `**/*.{${scan.join(',')}}`

  const create = (pattern: string) => {
    const patterns = cwds.map((cwd) => `${addLastSlash(cwd)}${pattern}`)
    return patterns.map((t) => normalizePath(t))
  }

  const absImagePatterns = create(imagePattern)
  const allImagePatterns = [...absImagePatterns, ...convertToIgnore(exclude)]

  const allCwdPatterns = [...create('**/*'), ...convertToIgnore(exclude)]

  return {
    imagePattern,
    absImagePatterns,
    allImagePatterns,

    allCwdPatterns,
  }
}
