import { useSetState, useUpdateEffect } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { startTransition, useEffect, useMemo } from 'react'
import { type ImageType } from '..'
import { bytesToKb, filterImages, shouldShowImage } from '../utils'
import ActionContext from './ActionContext'
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
  const imageType = useMemo(
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

  // Everytime list changed, update visibleList
  // the only entry to update visibleList
  useUpdateEffect(() => {
    setImageSingleTree((t) => ({ visibleList: t.list.filter(shouldShowImage) }))
  }, [imageSingleTree.list])

  useUpdateEffect(() => {
    setImageSingleTree({
      originalList: imageList,
      list: sort ? [...sortImages(sort, imageList)] : imageList,
      visibleList: imageList,
    })
  }, [imageList])

  const { sort, displayImageTypes } = SettingsContext.usePicker(['sort', 'displayImageTypes'])
  useEffect(() => {
    if (sort) {
      setImageSingleTree((t) => ({ list: [...sortImages(sort, t.list)] }))
    }
  }, [sort])

  // display image type setting change
  useEffect(() => {
    startTransition(() => {
      setImageSingleTree((img) => ({
        list: img.list.map((t) => ({ ...t, visible: { ...t.visible, type: displayImageTypes?.includes(t.fileType) } })),
      }))
    })
  }, [displayImageTypes])

  // filter action triggerd
  const { sizeFilter } = ActionContext.usePicker(['sizeFilter'])
  useUpdateEffect(() => {
    if (sizeFilter?.active) {
      setImageSingleTree((t) => ({
        list: t.list.map((t) => ({
          ...t,
          visible: {
            ...t.visible,
            size:
              bytesToKb(t.stats.size) >= (sizeFilter.value.min || 0) &&
              bytesToKb(t.stats.size) <= (sizeFilter.value.max || Number.POSITIVE_INFINITY),
          },
        })),
      }))
    } else {
      setImageSingleTree((t) => ({
        list: t.list.map((t) => ({ ...t, visible: { ...t.visible, size: true } })),
      }))
    }
  }, [sizeFilter])

  return {
    imageSingleTree,
    setImageSingleTree,
    workspaceFolders,
    dirs,
    allDirs,
    imageType,
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
