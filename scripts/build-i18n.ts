import { destrUtil } from '@minko-fe/lodash-pro'
import fg from 'fast-glob'
import { flatten } from 'flat'
import fs from 'fs-extra'
import JSON5 from 'json5'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FALLBACK_LANGUAGE } from '~/meta'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

;(async () => {
  const fallbackMessages = destrUtil.destr<AnyObject>(
    JSON5.parse(await fs.readFile(path.resolve(__dirname, `../locales/${FALLBACK_LANGUAGE}.json5`), 'utf-8')),
  )

  const files = await fg('*.json5', {
    cwd: path.resolve(__dirname, '../locales'),
    absolute: true,
  })

  for (const file of files) {
    const { name: locale } = path.parse(file)
    let messages = destrUtil.destr<AnyObject>(JSON5.parse(await fs.readFile(file, 'utf-8')))

    Object.keys(fallbackMessages).forEach((key) => {
      messages[key] = messages[key] || fallbackMessages[key]
    })

    messages = flatten(messages)

    const output = locale === FALLBACK_LANGUAGE ? './package.nls.json' : `./package.nls.${locale.toLowerCase()}.json`

    await fs.writeJson(output, messages, {
      encoding: 'utf-8',
      spaces: 2,
      EOL: '\n',
    })
  }
})()
