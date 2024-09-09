import { remove } from 'lodash-es'
import micromatch from 'micromatch'
import path from 'node:path'
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

export function imageGlob(options: { scan: string[]; exclude: string[]; root: string[]; cwd?: string }) {
  const { scan, exclude, root, cwd } = options

  const imagePattern = `**/*.{${scan.join(',')}}`
  const dirPattern = '**/*'

  function create(p: string) {
    let patterns: string[]
    if (cwd) {
      patterns = [`${addLastSlash(cwd)}${p}`]
    }
    patterns = root.map((r) => `${addLastSlash(r)}${p}`)
    return patterns.map((t) => normalizePath(t))
  }

  const absImagePatterns = create(imagePattern)
  const dirs = create('').map((t) => path.basename(t))

  const absDirPatterns = create(dirPattern)

  const ignore = convertToIgnore(exclude)

  dirs.forEach((dir) => {
    // 如果目录是被忽略的，则把ignore中的排除规则删除
    if (micromatch.isMatch(dir, ignore)) {
      remove(ignore, (p) => micromatch.isMatch(dir, convertToPositivePattern(p)))
    }
  })

  const allImagePatterns = [...absImagePatterns, ...ignore]

  return {
    imagePattern,
    absImagePatterns,

    dirPattern,
    absDirPatterns,

    ignore,
    allImagePatterns,
  }
}
