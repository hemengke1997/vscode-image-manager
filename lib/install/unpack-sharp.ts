// 手动安装 sharp binary
// Adopt from prebuild-install (MIT)

import minimist from 'minimist'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import resolveDownloadUrl from 'prebuild-install/bin'
import pump from 'pump'
import tarFs from 'tar-fs'

function unpack(opts: {
  /**
   * 解压路径
   */
  path: string
  /**
   * 二进制文件路径
   */
  binPath: string
}) {
  const options = {
    readable: true,
    writable: true,
    hardlinkAsFilesFallback: true,
  }
  const extract = tarFs.extract(opts.path, options).on('entry', () => {})

  pump(fs.createReadStream(opts.binPath), zlib.createGunzip(), extract)
}

const { path: extractPath, binPath } = minimist(process.argv.slice(2))

const userBinFilename = path.basename(binPath)

// 用户当前系统合法的sharp binary文件名
const validBinFilename = path.basename(resolveDownloadUrl())

// 找到符合当前系统条件的二进制文件解压
if (userBinFilename === validBinFilename) {
  unpack({
    path: extractPath,
    binPath,
  })
} else {
  process.exit(1)
}
