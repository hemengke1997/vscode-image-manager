import path from 'node:path'
import UnClipboard from '../UnClipboard'

const bin = path.join(__dirname, './clipboard/windows/bin/cb.exe')

export default new UnClipboard(bin)
