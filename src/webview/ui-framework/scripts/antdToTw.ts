import fs from 'node:fs'
import path from 'node:path'
import { type Declaration, type Rule } from 'postcss'
import validate from 'validate-color'

function readAntdCss() {
  const cssFile = path.resolve(__dirname, '../antd.css')
  const css = fs.readFileSync(cssFile, 'utf-8')
  return css
}

function isVariableDeclaration(decl: Declaration) {
  return Boolean(decl.value) && decl.prop.startsWith('--')
}

function isColor(value: string) {
  return validate(value)
}

function isMotion(name: string) {
  return name.includes('motion')
}

function isBoxShadow(name: string) {
  return name.includes('box-shadow')
}

function isFantFamily(name: string) {
  return name.includes('font-family')
}

function isOutsideRoot(rule: Rule) {
  return rule.selectors.length !== 1 || rule.selectors[0] !== ':root' || rule.parent?.type !== 'root'
}

async function parseCss(css: string) {
  const { default: postcss } = await import('postcss')
  const root = postcss.parse(css)

  const colors = new Map<string, string>()
  const animation = new Map<string, string>()
  const boxShadow = new Map<string, string>()
  const fontFamily = new Map<string, string>()

  root.walkRules((rule) => {
    if (isOutsideRoot(rule)) {
      return
    }

    rule.each((decl) => {
      decl = decl as Declaration
      if (isVariableDeclaration(decl)) {
        const name = decl.prop.replace('--', '')
        const value = `var(${decl.prop})`
        if (isColor(decl.value)) {
          colors.set(name, value)
        } else if (isMotion(decl.prop)) {
          animation.set(name, value)
        } else if (isBoxShadow(decl.prop)) {
          boxShadow.set(name, value)
        } else if (isFantFamily(decl.prop)) {
          fontFamily.set(name, value)
        }
      }
    })
  })

  return {
    colors,
    animation,
    boxShadow,
    fontFamily,
  }
}

type UnPromise<T> = T extends Promise<infer U> ? U : T

async function writeTwToJs(param: UnPromise<ReturnType<typeof parseCss>>) {
  const theme: Record<string, Record<string, string>> = {}
  Object.keys(param).forEach((key) => {
    theme[key] = Object.fromEntries(param[key])
  })
  const content = `module.exports = ${JSON.stringify(theme)}`

  const out = path.resolve(__dirname, '../theme.cjs')

  fs.writeFileSync(out, content)

  const { execa } = await import('execa')
  await execa('eslint', [out, '--fix'])
}

async function antdToTw() {
  const css = readAntdCss()

  if (css) {
    const parsedCss = await parseCss(css)
    await writeTwToJs(parsedCss)
  } else {
    console.error('antd.css not found')
  }
}

antdToTw()
