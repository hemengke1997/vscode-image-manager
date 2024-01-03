import { type ExecaReturnBase, type ExecaReturnValue, type Options, type SyncOptions } from 'execa'
import macos from './macos'

export type PlatformClipboard = {
  copy: (source: string | string[], options: Options) => Promise<ExecaReturnValue<string>>
  paste: (destination: string | string[], options: Options) => Promise<string>
  copySycn: (source: string | string[], options: SyncOptions) => ExecaReturnBase<string>
  pasteSync: (destination: string | string[], options: SyncOptions) => string
}

function platformClipboard() {
  switch (process.platform) {
    case 'darwin': {
      return macos
    }

    default:
      break
  }
}

export { platformClipboard }
