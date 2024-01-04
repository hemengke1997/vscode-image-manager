import { castArray } from '@minko-fe/lodash-pro'
import { type CommonOptions, type Options, type SyncOptions, execa, execaSync } from 'execa'

class UnClipboard {
  constructor(
    private _binarayPath: string,
    private _options?: CommonOptions,
  ) {
    this._options = {
      ..._options,
      stdio: 'inherit',
    }
  }
  async copy(args: string | string[], options?: Options) {
    return execa(this._binarayPath, ['copy', ...castArray(args)], { ...options, ...this._options })
  }
  async paste(options: Options, args?: string | string[]) {
    return await execa(this._binarayPath, ['paste', ...castArray(args)], {
      ...options,
      ...this._options,
    })
  }
  copySycn(args: string | string[], options?: SyncOptions) {
    return execaSync(this._binarayPath, ['copy', ...castArray(args)], { ...options, ...this._options })
  }
  pasteSync(options: SyncOptions, args?: string | string[]) {
    return execaSync(this._binarayPath, ['paste', ...castArray(args)], { ...options, ...this._options })
  }
}

export default UnClipboard
