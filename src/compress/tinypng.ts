import fs from 'node:fs'
import https from 'node:https'
import path from 'node:path'
import UserAgent from 'user-agents'

export async function tiny_compress(filePath: string): Promise<string | undefined> {
  if (isTinyImgFile(filePath)) {
    try {
      const postInfo = await fileUpload(filePath)
      await fileUpdate(filePath, postInfo)
    } catch (e) {
      return `compress ${filePath} failed: ${e}`
    }
  } else {
    return `file ${filePath} is not a tiny image. Only support ${DEFAULT_CONFIG.exts.join(', ')} and size <= ${
      DEFAULT_CONFIG.max / 1024 / 1024
    }MB`
  }
}

function genRandomIP() {
  return Array.from(Array(3))
    .map(() => Number.parseInt(String(Math.random() * 255), 10))
    .concat([new Date().getTime() % 255])
    .join('.')
}

interface PostInfo {
  error?: any
  output: {
    url: string
    size: number
    type: string
    width: number
    height: number
    ratio: number
  }
}

async function fileUpload(imgPath: string): Promise<PostInfo> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: 'POST',
        hostname: 'tinypng.com',
        path: '/backend/opt/shrink',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': new UserAgent().toString(),
          'X-Forwarded-For': genRandomIP(),
        },
        agent: new https.Agent({ rejectUnauthorized: false }),
      },
      (res) => {
        res.on('data', (buffer: Buffer) => {
          const postInfo = JSON.parse(buffer.toString())
          if (postInfo.error) {
            reject(postInfo.error)
          } else {
            resolve(postInfo)
          }
        })
      },
    )
    req.write(fs.readFileSync(imgPath), 'binary')
    req.on('error', (e) => {
      reject(e)
    })
    req.end()
  })
}

async function fileUpdate(entryImgPath: string, info: PostInfo): Promise<void> {
  return new Promise((resolve, reject) => {
    const options = new URL(info.output.url)
    const req = https.request(options, (res) => {
      let body = ''
      res.setEncoding('binary')
      res.on('data', (data) => (body += data))
      res.on('end', () => {
        fs.writeFile(getOutputPath(entryImgPath, { replace: false }), body, 'binary', (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    })
    req.on('error', (e) => {
      reject(e)
    })
    req.end()
  })
}

function generateOutputPath(filePath: string, suffix = '-tiny') {
  const { name, ext, dir } = path.parse(filePath)
  const filename = `${name}${suffix}`
  const outputPath = `${dir}/${filename}${ext}`

  const fileExists = fs.existsSync(outputPath)

  if (fileExists) {
    return generateOutputPath(outputPath)
  }
  return outputPath
}

function getOutputPath(
  targetPath: string,
  options: {
    replace?: boolean
  } = {},
) {
  const { replace = true } = options

  const outputPath = replace ? targetPath : generateOutputPath(targetPath)

  return outputPath
}

const DEFAULT_CONFIG = {
  exts: ['.png', '.jpg', '.jpeg', '.webp'],
  max: 5 * 1024 * 1024, // 5MB
}

function isTinyImgFile(filePath: string) {
  const fileStat = fs.statSync(filePath)
  return (
    fileStat.isFile() && DEFAULT_CONFIG.exts.includes(path.extname(filePath)) && fileStat.size <= DEFAULT_CONFIG.max
  )
}
