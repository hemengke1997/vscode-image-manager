import fs from 'fs-extra'
import fetch from 'node-fetch'
import path from 'node:path'
import stream from 'node:stream'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { cleanVersion } from '~/utils'
import logger from '~/utils/logger'
import { devDependencies } from '../package.json'

const pipeline = promisify(stream.pipeline)

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ReleaseDir = path.resolve(__dirname, '../releases')
const currentVersion = cleanVersion(devDependencies['@minko-fe/sharp'])

function isVersionDiff() {
  const versionJsonFile = path.resolve(ReleaseDir, 'version.json')
  let lastVersion = ''
  let isDiff = false

  try {
    lastVersion = fs.readJSONSync(versionJsonFile).version
  } catch {
    isDiff = true
  }

  isDiff = lastVersion !== currentVersion
  if (isDiff) {
    fs.writeJSONSync(versionJsonFile, { version: currentVersion }, { spaces: 2 })
  }
  return isDiff
}

;(async () => {
  if (!isVersionDiff()) {
    logger.info('[Sharp Release]: No new version detected.')
    return
  }

  const url = `https://api.github.com/repos/hemengke1997/sharp/releases/tags/v${currentVersion}`

  try {
    const response = await fetch(url)
    const data = (await response.json()) as {
      assets: { browser_download_url: string }[]
    }

    async function downloadFile(asset: { browser_download_url: string }) {
      const downloadUrl = asset.browser_download_url
      const fileName = downloadUrl.split('/').pop() as string

      logger.start(`Downloading ${fileName}...`)

      const downloadResponse = await fetch(downloadUrl)
      if (!downloadResponse.ok) throw new Error(`Failed to download ${fileName}`)

      await pipeline(downloadResponse.body!, fs.createWriteStream(path.join(ReleaseDir, fileName)))

      logger.success(`${fileName} downloaded successfully.`)
    }

    if (data.assets && data.assets.length > 0) {
      fs.ensureDirSync(ReleaseDir)

      // record old releases
      const oldReleases = fs.readdirSync(ReleaseDir).filter((file) => file !== 'version.json')

      // download all release files
      await Promise.all(data.assets.map(downloadFile))

      // clean up old releases
      await Promise.all(oldReleases.map((file) => fs.unlink(path.join(ReleaseDir, file))))
    } else {
      logger.error('No releases found.')
    }
  } catch (error) {
    logger.error('Error downloading releases:', error)
  }
})()
