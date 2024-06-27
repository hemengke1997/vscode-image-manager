import fs from 'fs-extra'
import path from 'node:path'
import stream from 'node:stream'
import { promisify } from 'node:util'
import fetch from 'node-fetch'
import logger from '~/utils/logger'
import { devDependencies } from '../package.json'

const pipeline = promisify(stream.pipeline)

async function downloadSharpReleases() {
  const url = `https://api.github.com/repos/hemengke1997/sharp/releases/tags/v${devDependencies['@minko-fe/sharp']}`

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

      await pipeline(downloadResponse.body!, fs.createWriteStream(path.resolve(__dirname, '../releases', fileName)))

      logger.success(`${fileName} downloaded successfully.`)
    }

    if (data.assets && data.assets.length > 0) {
      fs.ensureDirSync(path.resolve(__dirname, '../releases'))
      // clean up old releases
      fs.emptyDirSync(path.resolve(__dirname, '../releases'))

      await Promise.all(data.assets.map(downloadFile))
    } else {
      logger.error('No releases found.')
    }
  } catch (error) {
    logger.error('Error downloading releases:', error)
  }
}

downloadSharpReleases()
