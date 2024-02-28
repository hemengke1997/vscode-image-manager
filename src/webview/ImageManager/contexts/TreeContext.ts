import { isFunction } from '@minko-fe/lodash-pro'
import { useAsyncEffect, useLatest, useMemoizedFn, useSetState, useUpdateEffect } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useEffect, useMemo } from 'react'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '~/webview/vscode-api'
import { type ImageType, type ImageVisibleFilterType } from '..'
import { bytesToKb, filterImages, shouldShowImage } from '../utils'
import ActionContext, { type ImageFilterType } from './ActionContext'
import SettingsContext from './SettingsContext'

export type ImageStateType = {
  originalList: ImageType[]
  list: ImageType[]
  visibleList: ImageType[]
}

function toogleVisible(
  imageList: ImageType[],
  key: ImageVisibleFilterType,
  condition: ((image: ImageType) => boolean) | boolean,
) {
  return imageList.map((image) => {
    return { ...image, visible: { ...image.visible, [key]: isFunction(condition) ? condition(image) : condition } }
  })
}

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

function useTreeContext(props: { imageList: ImageType[] }) {
  const { imageList: imageListProp } = props

  const [imageSingleTree, setImageSingleTree] = useSetState<ImageStateType>({
    originalList: [],
    list: [],
    visibleList: [],
  })
  const latestImageList = useLatest(imageSingleTree.list).current

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
  // !! 修改 visibleList 的唯一入口 !!
  useEffect(() => {
    setImageSingleTree((t) => {
      return { visibleList: t.list.filter(shouldShowImage) }
    })
  }, [imageSingleTree.list])

  // !!CARE!!: once imageListProp changed, the list will be updated
  // 以下条件会影响list的生成结果。如果有更多的影响因素，都需要加在这里面
  // sort
  // display image type
  // size filter
  // git staged filter
  const generateImageList = async (imageList: ImageType[]) => {
    let res = onSortChange(imageList, sort)
    res = onDisplayImageTypeChange(res, displayImageTypes?.checked)
    res = onSizeFilterChange(res, imageFilter)
    res = await onGitStagedFilterChange(res, imageFilter)
    return res
  }

  useAsyncEffect(async () => {
    const list = await generateImageList(imageListProp)
    setImageSingleTree({
      originalList: imageListProp,
      list,
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
      return toogleVisible(imageList, 'type', (t) => displayImageTypes?.includes(t.fileType))
    }
    return toogleVisible(imageList, 'type', true)
  })

  // display image type setting change
  useUpdateEffect(() => {
    setImageSingleTree((t) => ({
      list: onDisplayImageTypeChange(t.list, displayImageTypes?.checked),
    }))
  }, [displayImageTypes?.checked])

  // filter action triggerd
  const { imageFilter } = ActionContext.usePicker(['imageFilter'])

  // action image filter change
  // 目前有以下filter
  // 1. size
  // 2. git-staged
  const onSizeFilterChange = useMemoizedFn((imageList: ImageType[], imageFilter: ImageFilterType) => {
    const {
      value: {
        size: { min, max },
      },
    } = imageFilter || { value: { size: {} } }

    return toogleVisible(
      imageList,
      'size',
      (t) => bytesToKb(t.stats.size) >= (min || 0) && bytesToKb(t.stats.size) <= (max || Number.POSITIVE_INFINITY),
    )
  })
  useUpdateEffect(() => {
    setImageSingleTree((t) => ({
      list: onSizeFilterChange(t.list, imageFilter),
    }))
  }, [imageFilter?.value.size])

  const onGitStagedFilterChange = useMemoizedFn((imageList: ImageType[], imageFilter: ImageFilterType) => {
    return new Promise<ImageType[]>((resolve) => {
      if (imageFilter?.value.git_staged) {
        vscodeApi.postMessage({ cmd: CmdToVscode.GET_GIT_STAGED_IMAGES }, (res) => {
          resolve(toogleVisible(imageList, 'git_staged', (t) => res.includes(t.path)))
        })
      } else {
        resolve(toogleVisible(imageList, 'git_staged', true))
      }
    })
  })
  useUpdateEffect(() => {
    onGitStagedFilterChange(latestImageList, imageFilter).then((list) => {
      setImageSingleTree({
        list,
      })
    })
  }, [imageFilter?.value.git_staged])

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
