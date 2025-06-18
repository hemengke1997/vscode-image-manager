import { atom } from 'jotai'

const imageSelectedMap = atom<Map<string, ImageType[]>>(new Map())

const imageSelected = atom((get) => {
  return Array.from(get(imageSelectedMap).values()).flat()
})

export enum CopyType {
  // 复制
  COPY = 'copy',
  // 剪切
  MOVE = 'move',
}

const imageCopied = atom<{
  list: ImageType[]
  type: CopyType
}>()

const fileTip = atom<{
  cut: boolean
}>()

export const FileAtoms = {
  imageSelectedMap,
  imageSelected,
  imageCopied,
  fileTip,
}
