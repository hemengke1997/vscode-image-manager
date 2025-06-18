import path from 'node:path'
import pMap, { pMapSkip } from 'p-map'
import logger from '~/utils/logger'
import { Config } from '../config/config'
import { hammingDistance, phash } from './phash'

export class Similarity {
  public static limit: {
    from: string[]
  } = {
    from: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'tiff', 'tif', 'avif', 'heif'],
  }

  static async findSimilar(image: ImageType, scope: ImageType[]) {
    let sourcehash: string

    const source = image.path
    const ext = this.getFileExt(source)
    if (!this.limit.from.includes(ext)) {
      return Promise.reject(new Error('format not supported'))
    }

    try {
      sourcehash = await phash(source)
    }
    catch (e) {
      return Promise.reject(e)
    }

    const result = await pMap(scope, async (image) => {
      try {
        if (image.path === source)
          return pMapSkip
        if (!this.limit.from.includes(image.extname))
          return pMapSkip
        const hash = await phash(image.path)
        return { image, hash }
      }
      catch (e) {
        logger.error(e)
        return pMapSkip
      }
    })

    const similar: { image: ImageType, distance: number }[] = []

    result.forEach((res) => {
      const distance = hammingDistance(sourcehash, res.hash)
      if (distance <= Config.similarity_precision) {
        similar.push({
          distance,
          image: res.image,
        })
      }
    })

    return similar
  }

  private static getFileExt(filePath: string) {
    return path.extname(filePath).slice(1)
  }
}
