import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import stream from 'node:stream'
import zlib from 'node:zlib'
import libvips from 'sharp/lib/libvips'
import tarFs from 'tar-fs'
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

const verifyIntegrity = function () {
  const expected = libvips.integrity(platformAndArch)

  const hash = createHash('sha512')
  return new stream.Transform({
    transform(chunk, _encoding, done) {
      hash.update(chunk)
      done(null, chunk)
    },
    flush(done) {
      const digest = `sha512-${hash.digest('base64')}`
      if (expected !== digest) {
        try {
          libvips.removeVendoredLibvips()
        } catch (err) {
          if (err instanceof Error) {
            libvips.log(err.message)
          }
        }
        libvips.log(`Integrity expected: ${expected}`)
        libvips.log(`Integrity received: ${digest}`)
        done(new Error(`Integrity check failed for ${platformAndArch}`))
      } else {
        libvips.log(`Integrity check passed for ${platformAndArch}`)
        done()
      }
    },
  })
}

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

const extractTarball = function (tarPath: string) {
  const versionedVendorPath = path.join(__dirname, '..', 'vendor', '8.14.5', platformAndArch)
  libvips.mkdirSync(versionedVendorPath)

  const ignoreVendorInclude = hasSharpPrebuild.includes(platformAndArch)
  const ignore = function (name: string) {
    return ignoreVendorInclude && name.includes('include/')
  }

  stream.pipeline(
    fs.createReadStream(tarPath),
    verifyIntegrity(),
    // @ts-expect-error
    new zlib.BrotliDecompress(),
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

extractTarball(process.argv[2])
