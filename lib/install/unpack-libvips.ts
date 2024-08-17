// 手动安装 libvips
// Adopt from sharp/install/libvips.js (Apache-2.0)

import libvips from '@minko-fe/sharp/lib/libvips'
import fs from 'node:fs'
import path from 'node:path'
import stream from 'node:stream'
import zlib from 'node:zlib'
import tarFs from 'tar-fs'
import { SHARP_LIBVIPS_VERSION } from '~/meta'
import { platform } from './platform'

const hasSharpPrebuild = [
  'darwin-x64',
  'darwin-arm64',
  'linux-arm64',
  'linux-x64',
  'linuxmusl-x64',
  'linuxmusl-arm64',
  'win32-ia32',
  'win32-x64',
]

const platformAndArch = platform()

const fail = function (err) {
  libvips.log(err)
  if (err.code === 'EACCES') {
    libvips.log('Are you trying to install as a root or sudo user?')
    libvips.log('- For npm <= v6, try again with the "--unsafe-perm" flag')
    libvips.log('- For npm >= v8, the user must own the directory "npm install" is run in')
  }
  libvips.log('Please see https://sharp.pixelplumbing.com/install for required dependencies')
  process.exit(1)
}

const unpackLibvips = function (tarPath: string) {
  const versionedVendorPath = path.join(__dirname, '..', 'vendor', SHARP_LIBVIPS_VERSION, platformAndArch)
  libvips.mkdirSync(versionedVendorPath)

  const ignoreVendorInclude = hasSharpPrebuild.includes(platformAndArch)
  const ignore = function (name: string) {
    return ignoreVendorInclude && name.includes('include/')
  }

  stream.pipeline(
    fs.createReadStream(tarPath),
    zlib.createGunzip(),
    tarFs.extract(versionedVendorPath, { ignore }),
    (err) => {
      if (err) {
        if (/unexpected end of file/.test(err.message)) {
          fail(new Error(`Please delete ${tarPath} as it is not a valid tarball`))
        }
        fail(err)
      }
    },
  )
}

unpackLibvips(process.argv[2])
