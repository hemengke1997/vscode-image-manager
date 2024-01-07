import { useSetState, useUpdateEffect } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { startTransition, useEffect, useMemo } from 'react'
import { type ImageType } from '..'
import { filterImages, shouldShowImage } from '../utils'
import SettingsContext from './SettingsContext'

export type ImageStateType = {
  originalList: ImageType[]
  list: ImageType[]
  visibleList: ImageType[]
}

function useTreeContext(props: { imageList: ImageType[] }) {
  const { imageList } = props

  const [imageSingleTree, setImageSingleTree] = useSetState<ImageStateType>({
    originalList: imageList,
    list: imageList,
    visibleList: imageList,
  })

  const workspaceFolders = useMemo(
    () =>
      filterImages(
        imageSingleTree.visibleList,
        (image) => ({
          label: image.workspaceFolder,
          value: image.absWorkspaceFolder,
        }),
        'value',
      ),
    [imageSingleTree.visibleList],
  )

  const dirs = useMemo(
    () =>
      filterImages(
        imageSingleTree.visibleList,
        (image) => ({
          label: image.dirPath,
          value: image.absDirPath,
        }),
        'value',
      ),
    [imageSingleTree.visibleList],
  )
  const allDirs = useMemo(
    () =>
      filterImages(
        imageSingleTree.originalList,
        (image) => ({ label: image.dirPath, value: image.absDirPath }),
        'value',
      ),
    [imageSingleTree.originalList],
  )
  const imageTypes = useMemo(
    () =>
      filterImages(
        imageSingleTree.visibleList,
        (image) => ({
          label: image.fileType,
          value: image.fileType,
        }),
        'value',
      ),
    [imageSingleTree.visibleList],
  )
  const allImageTypes = useMemo(
    () =>
      filterImages(
        imageSingleTree.originalList,
        (image) => ({
          label: image.fileType,
          value: image.fileType,
        }),
        'value',
      ),
    [imageSingleTree.originalList],
  )

  // everytime list changed, update visibleList
  // the only entry to update visibleList
  useUpdateEffect(() => {
    setImageSingleTree((t) => ({ visibleList: t.list.filter(shouldShowImage) }))
  }, [imageSingleTree.list])

  const { sort, displayImageTypes } = SettingsContext.usePicker(['sort', 'displayImageTypes'])
  useEffect(() => {
    if (sort) {
      setImageSingleTree((t) => ({ list: [...sortImages(sort, t.list)] }))
    }
  }, [sort])

  useUpdateEffect(() => {
    startTransition(() => {
      setImageSingleTree((img) => ({
        list: img.list.map((t) => ({ ...t, visible: { ...t.visible, type: displayImageTypes?.includes(t.fileType) } })),
      }))
    })
  }, [displayImageTypes])

  return {
    imageSingleTree,
    setImageSingleTree,
    workspaceFolders,
    dirs,
    allDirs,
    imageTypes,
    allImageTypes,
  }
}

const TreeContext = createContainer(useTreeContext)

export default TreeContext

function sortImages(sort: string[], images: ImageType[]) {
  images.sort((a, b) => {
    if (sort[0] === 'size') {
      return sort[1] === 'desc' ? b.stats.size - a.stats.size : a.stats.size - b.stats.size
    }
    if (sort[0] === 'name') {
      return sort[1] === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
    }
    return 0
  })
  return images
}
