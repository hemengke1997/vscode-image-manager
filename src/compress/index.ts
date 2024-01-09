import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { tiny_compress } from './tinypng'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const IMAGE = path.resolve(__dirname, '../../screenshots/overview.png')

tiny_compress(IMAGE)
console.log(path.parse(IMAGE))

export { tiny_compress }
