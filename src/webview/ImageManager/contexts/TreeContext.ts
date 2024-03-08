import { isFunction } from '@minko-fe/lodash-pro'
import { useAsyncEffect, useLatest, useMemoizedFn, useSetState, useUpdateEffect } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useEffect, useMemo } from 'react'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '~/webview/vscode-api'
import { type ImageType, type ImageVisibleFilterType } from '..'
import { FilterRadioValue } from '../components/ImageActions'
import { bytesToKb, filterImages, shouldShowImage } from '../utils'
import ActionContext from './ActionContext'
import SettingsContext from './SettingsContext'

export type ImageStateType = {
  originalList: ImageType[]
  list: ImageType[]
  visibleList: ImageType[]
}

type Condition = {
  key: ImageVisibleFilterType
  condition: ((image: ImageType, index: number) => boolean | Promise<boolean>) | boolean
}

// 根据条件改变图片的visible
async function changeImageVisible(imageList: ImageType[], conditions: Condition[]) {
  return Promise.all(
    imageList.map(async (image, index) => {
      for (const { key, condition } of conditions) {
        image = {
          ...image,
          visible: {
            ...image.visible,
            [key]: isFunction(condition) ? await condition(image, index) : condition,
          },
        }
      }
      return image
    }),
  )
}

// 图片排序
// 1. 按照文件大小排序
// 2. 按照文件名排序
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

  // 筛选出当前显示的文件夹
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

  // 筛选出当前显示的文件夹
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

  // 筛选出所有的文件夹
  const allDirs = useMemo(
    () =>
      filterImages(
        imageSingleTree.originalList,
        (image) => ({ label: image.dirPath, value: image.absDirPath }),
        'value',
      ),
    [imageSingleTree.originalList],
  )

  // 筛选出当前显示的图片类型
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

  // 筛选出所有的图片类型
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
  // 1. sort

  // 2. filter:
  // display image type
  // size filter
  // git staged filter
  const generateImageList = async (imageList: ImageType[]) => {
    // sort
    let res = onSortChange(imageList, sort)

    // filter
    res = await changeImageVisibleByKeys(res, ['type', 'size', 'git_staged', 'compressed'])

    return res
  }

  const changeImageVisibleByKeys = useMemoizedFn(
    (imageList: ImageType[], key: ImageVisibleFilterType[]): Promise<ImageType[]> => {
      const builtInConditions: Condition[] = [
        {
          key: 'type',
          condition: (image) =>
            displayImageTypes?.checked ? displayImageTypes.checked.includes(image.fileType) : true,
        },
        {
          key: 'size',
          condition: (image) =>
            bytesToKb(image.stats.size) >= (imageFilter?.value.size?.min || 0) &&
            bytesToKb(image.stats.size) <= (imageFilter?.value.size?.max || Number.POSITIVE_INFINITY),
        },
        {
          key: 'git_staged',
          condition: (image, index) => {
            if (
              imageFilter?.value.git_staged &&
              [FilterRadioValue.yes, FilterRadioValue.no].includes(imageFilter.value.git_staged)
            ) {
              let staged: string[] = []
              if (index === 0) {
                // Get staged images only once to improve performance
                ;(async () => {
                  staged = await new Promise<string[]>((resolve) => {
                    vscodeApi.postMessage({ cmd: CmdToVscode.GET_GIT_STAGED_IMAGES }, (res) => {
                      resolve(res || [])
                    })
                  })
                })()
              }
              return imageFilter.value.git_staged === FilterRadioValue.yes
                ? staged.includes(image.path)
                : !staged.includes(image.path)
            }
            return true
          },
        },
        {
          key: 'compressed',
          condition(image) {
            if (
              imageFilter?.value.compressed &&
              [FilterRadioValue.yes, FilterRadioValue.no].includes(imageFilter.value.compressed)
            ) {
              return (async () => {
                return await new Promise<boolean>((resolve) => {
                  vscodeApi.postMessage(
                    { cmd: CmdToVscode.GET_IMAGE_METADATA, data: { filePath: image.path } },
                    (res) => {
                      resolve(
                        imageFilter.value.compressed === FilterRadioValue.yes ? res?.compressed : !res?.compressed,
                      )
                    },
                  )
                })
              })()
            }
            return true
          },
        },
      ]

      const conditions = key.map((k) => builtInConditions.find((c) => c.key === k) as Condition)
      return changeImageVisible(imageList, conditions)
    },
  )

  // prop 改变时，重新根据目前已有的限制条件生成list
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

  const onDisplayImageTypeChange = useMemoizedFn((imageList: ImageType[]) => {
    return changeImageVisibleByKeys(imageList, ['type'])
  })

  // display image type setting change
  useUpdateEffect(() => {
    onDisplayImageTypeChange(latestImageList).then((list) => {
      setImageSingleTree({
        list,
      })
    })
  }, [displayImageTypes?.checked])

  // filter action triggerd
  const { imageFilter } = ActionContext.usePicker(['imageFilter'])

  // action image filter change
  // 目前有以下filter
  // 1. size
  // 2. git-staged
  // 3. compressed

  // 1. size filter
  const onSizeFilterChange = useMemoizedFn((imageList: ImageType[]) => {
    return changeImageVisibleByKeys(imageList, ['size'])
  })
  useUpdateEffect(() => {
    onSizeFilterChange(latestImageList).then((list) => {
      setImageSingleTree({
        list,
      })
    })
  }, [imageFilter?.value.size])

  // 2. git-staged filter
  const onGitStagedFilterChange = useMemoizedFn((imageList: ImageType[]) => {
    return changeImageVisibleByKeys(imageList, ['git_staged'])
  })
  useUpdateEffect(() => {
    onGitStagedFilterChange(latestImageList).then((list) => {
      setImageSingleTree({
        list,
      })
    })
  }, [imageFilter?.value.git_staged])

  // 3. compressed filter
  const onCompressedFilterChange = useMemoizedFn((imageList: ImageType[]) => {
    return changeImageVisibleByKeys(imageList, ['compressed'])
  })
  useUpdateEffect(() => {
    onCompressedFilterChange(latestImageList).then((list) => {
      setImageSingleTree({
        list,
      })
    })
  }, [imageFilter?.value.compressed])

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
