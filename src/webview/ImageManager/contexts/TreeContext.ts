import { useMemoizedFn, useSetState, useUpdateEffect } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useEffect, useMemo } from 'react'
import { type ImageType } from '..'
import { bytesToKb, filterImages, shouldShowImage } from '../utils'
import ActionContext, { type SizeFilterType } from './ActionContext'
import SettingsContext from './SettingsContext'

export type ImageStateType = {
  originalList: ImageType[]
  list: ImageType[]
  visibleList: ImageType[]
}

function useTreeContext(props: { imageList: ImageType[] }) {
  const { imageList: imageListProp } = props

  const [imageSingleTree, setImageSingleTree] = useSetState<ImageStateType>({
    originalList: [],
    list: [],
    visibleList: [],
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
    setImageSingleTree((t) => {
      return { visibleList: t.list.filter(shouldShowImage) }
    })
  }, [imageSingleTree.list])

  // sort
  // size filter
  // display image type
  const generateImageList = useMemoizedFn((imageList: ImageType[]) => {
    const s = onSortChange(imageList, sort)
    const d = onDisplayImageTypeChange(s, displayImageTypes?.checked)
    return onSizeFilterChange(d, sizeFilter)
  })

  useEffect(() => {
    setImageSingleTree({
      originalList: imageListProp,
      list: generateImageList(imageListProp),
    })
  }, [imageListProp])

  const { sort, displayImageTypes } = SettingsContext.usePicker(['sort', 'displayImageTypes'])

  const onSortChange = useMemoizedFn((imageList: ImageType[], sort: string[] | undefined) => {
    if (sort) {
      return [...sortImages(sort, imageList)]
    }
    return imageList
  })

  useUpdateEffect(() => {
    setImageSingleTree((t) => ({
      list: onSortChange(t.list, sort),
    }))
  }, [sort])

  const onDisplayImageTypeChange = useMemoizedFn((imageList: ImageType[], displayImageTypes: string[] | undefined) => {
    if (displayImageTypes) {
      return imageList.map((t) => ({ ...t, visible: { ...t.visible, type: displayImageTypes?.includes(t.fileType) } }))
    }
    return imageList.map((t) => ({ ...t, visible: { ...t.visible, type: true } }))
  })

  // display image type setting change
  useUpdateEffect(() => {
    setImageSingleTree((t) => ({
      list: onDisplayImageTypeChange(t.list, displayImageTypes?.checked),
    }))
  }, [displayImageTypes?.checked])

  // filter action triggerd
  const { sizeFilter } = ActionContext.usePicker(['sizeFilter'])

  const onSizeFilterChange = useMemoizedFn((imageList: ImageType[], sizeFilter: SizeFilterType) => {
    if (sizeFilter?.active) {
      return imageList.map((t) => ({
        ...t,
        visible: {
          ...t.visible,
          size:
            bytesToKb(t.stats.size) >= (sizeFilter.value.min || 0) &&
            bytesToKb(t.stats.size) <= (sizeFilter.value.max || Number.POSITIVE_INFINITY),
        },
      }))
    } else {
      return imageList.map((t) => ({ ...t, visible: { ...t.visible, size: true } }))
    }
  })

  useUpdateEffect(() => {
    setImageSingleTree((t) => ({
      list: onSizeFilterChange(t.list, sizeFilter),
    }))
  }, [sizeFilter])

  return {
    imageSingleTree,
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
