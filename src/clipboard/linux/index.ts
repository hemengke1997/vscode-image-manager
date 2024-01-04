import { $ } from 'execa'
import path from 'node:path'
import UnClipboard from '../UnClipboard'

const bin = path.join(__dirname, './clipboard/linux/bin/cb')

$`chmod +x ${bin}`

export default new UnClipboard(bin)
