import { type ResizeOptions, type Sharp } from 'sharp'

type IcoBuffer = Buffer
type PngOrBmpBuffer = Buffer

interface IcoOptions {
  size?: number
  resizeOptions?: ResizeOptions
}

function encode(bufferList: PngOrBmpBuffer[]) {
  const icoEndec = require('ico-endec')
  return icoEndec.encode(bufferList) as IcoBuffer
}

async function resize(image: Sharp, { size, resizeOptions }: IcoOptions) {
  image = image.clone().resize({
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    ...resizeOptions,
    width: size,
    height: size,
  })

  return image
}

export { encode, resize }
