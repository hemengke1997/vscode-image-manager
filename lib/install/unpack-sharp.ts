// 手动安装 sharp
// Token from prebuild-install (MIT)

import minimist from 'minimist'
import fs from 'node:fs'
import zlib from 'node:zlib'
import pump from 'pump'
import tarFs from 'tar-fs'

function unpack(opts: { path: string; binPath: string }) {
  const options = {
    readable: true,
    writable: true,
    hardlinkAsFilesFallback: true,
  }
  const extract = tarFs.extract(opts.path, options).on('entry', () => {})

  pump(fs.createReadStream(opts.binPath), zlib.createGunzip(), extract)
}

const argv = minimist(process.argv.slice(2))

unpack({
  path: argv.path,
  binPath: argv.binPath,
})
