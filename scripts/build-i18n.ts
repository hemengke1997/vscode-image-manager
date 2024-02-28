import fg from 'fast-glob'
import fs from 'fs-extra'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_LOCALE = 'en'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function nestToFlatten(messages: Record<string, string>) {
  const result: Record<string, string> = {}
  for (const key in messages) {
    const value = messages[key]
    if (typeof value === 'object') {
      const nested = nestToFlatten(value)
      for (const nestedKey in nested) {
        result[`${key}.${nestedKey}`] = nested[nestedKey]
      }
    } else {
      result[key] = value
    }
  }
  return result
}

;(async () => {
  const fallbackMessages = JSON.parse(
    await fs.readFile(path.resolve(__dirname, `../locales/${DEFAULT_LOCALE}.json`), 'utf-8'),
  )

  const files = await fg('*.json', {
    cwd: path.resolve(__dirname, '../locales'),
    absolute: true,
  })

  for (const file of files) {
    const { name: locale } = path.parse(file)
    let messages = JSON.parse(await fs.readFile(file, 'utf-8'))

    Object.keys(fallbackMessages).forEach((key) => {
      messages[key] = messages[key] || fallbackMessages[key]
    })

    messages = nestToFlatten(messages)

    const output = locale === DEFAULT_LOCALE ? './package.nls.json' : `./package.nls.${locale.toLowerCase()}.json`

    await fs.writeJson(output, messages, {
      encoding: 'utf-8',
      spaces: 2,
      EOL: '\n',
    })
  }
})()