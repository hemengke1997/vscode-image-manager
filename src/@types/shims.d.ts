declare module 'piexifjs' {
  export function load(data: string): any
  export function dump(exifObj: any): string
  export function insert(exifStr: string, img: string): string
  export function remove(exifStr: string): string
  export const ImageIFD: {
    ImageDescription: number
  }
}
