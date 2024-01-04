import { $ } from 'execa'
import path from 'node:path'
import UnClipboard from '../UnClipboard'

const bin = path.join(__dirname, './clipboard/macos/bin/cb')

$`chmod +x ${bin}`

export default new UnClipboard(bin)
