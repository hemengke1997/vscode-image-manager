import { useControlledState, useLocalStorageState, useSetState } from '@minko-fe/react-hook'
import { CmdToVscode } from '@root/message/shared'
import { App, Card, Modal } from 'antd'
import { type Dirent, type Stats } from 'node:fs'
import { startTransition, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { localStorageEnum } from '../local-storage'
// import { isHotkeyPressed, useHotkeys } from 'react-hotkeys-hook'
import PrimaryColorPicker from '../ui-framework/src/components/CustomConfigProvider/components/PrimaryColorPicker'
import { vscodeApi } from '../vscode-api'
import CollapseTree from './components/CollapseTree'
import DisplayGroup, { type GroupType } from './components/DisplayGroup'
import DisplaySort from './components/DisplaySort'
import DisplayType, { type DisplayImageTypes } from './components/DisplayType'
import ImageActions from './components/ImageActions'
import ImageAnalysorContext from './contexts/ImageAnalysorContext'
import useWheelScaleEvent from './hooks/useWheelScaleEvent'
import OperationItemUI from './ui/OperationItemUI'
import { Colors } from './utils/color'

vscodeApi.registerEventListener()

// image 显隐由visible决定，目前有两个筛选条件
// 1. type 筛选图片类型
// 2. size 筛选图片大小
type ImageVisibleFilterType = 'type' | 'size'

export type ImageType = {
  path: string
  fileType: string
  dirPath: string
  relativePath: string
  vscodePath: string
  name: string
  dirent: Dirent
  stats: Stats

  // extra
  visible: Partial<Record<ImageVisibleFilterType | string, boolean>> | undefined
}

export default function ImageAnalysor() {
  const { message } = App.useApp()
  const { t } = useTranslation()

  const { images, setImages, imageRefreshedState, refreshImages, setCollapseOpen } = ImageAnalysorContext.usePicker([
    'images',
    'setImages',
    'imageRefreshedState',
    'refreshImages',
    'setCollapseOpen',
  ])

  const [imageTypes, setImageTypes] = useSetState<DisplayImageTypes>({ all: [], checked: [] })

  const [dirs, setDirs] = useSetState<{ all: string[] }>({ all: [] })

  const { refreshTimes, refreshType } = imageRefreshedState

  useEffect(() => {
    const isRefresh = refreshTimes && refreshType === 'refresh'
    const messageKey = 'REFRESH_IMAGES'
    if (isRefresh) {
      message.loading({
        content: t('ns.img_refreshing'),
        key: messageKey,
      })
    }

    vscodeApi.postMessage({ cmd: CmdToVscode.GET_ALL_IMAGES }, (data) => {
      setImages({ originalList: data.imgs, list: sortImages(sort!, data.imgs), loading: false })

      setDirs({ all: data.dirs.sort() })
      setImageTypes({
        all: data.fileTypes,
        checked: data.fileTypes,
      })

      !refreshTimes && setCollapseOpen((t) => t + 1)

      if (isRefresh) {
        message.destroy(messageKey)
        message.success(t('ns.img_refreshed'))
      }
    })
  }, [refreshTimes])

  /* ------------ image type checkbox ----------- */
  const onImageTypeChange = (checked: string[]) => {
    setImageTypes({ checked })
    startTransition(() => {
      setImages((img) => ({
        list: img.list.map((t) => ({ ...t, visible: { ...t.visible, type: checked.includes(t.fileType) } })),
      }))
    })
  }

  /* ---------------- image group --------------- */
  const groupType: { label: string; value: GroupType; priority: number }[] = [
    {
      label: t('ns.group_by_dir'),
      value: 'dir',
      priority: 1, // highest
    },
    {
      label: t('ns.group_by_type'),
      value: 'type',
      priority: 2,
    },
  ]

  const [_displayGroup, _setDisplayGroup] = useLocalStorageState<GroupType[]>(
    localStorageEnum.LOCAL_STORAGE_DISPLAY_TYPE,
    {
      defaultValue: ['dir'],
    },
  )

  const [displayGroup, setDisplayGroup] = useControlledState({
    defaultValue: _displayGroup,
    value: _displayGroup,
    onChange: (value) => {
      // sort by priority
      if (value.length > 1) {
        const findPriority = (v: GroupType) => {
          return groupType.find((item) => item.value === v)!.priority
        }
        value = value.sort((a, b) => {
          return findPriority(a) - findPriority(b)
        })
      }
      _setDisplayGroup(value)
    },
  })

  const { backgroundColor, setBackgroundColor } = ImageAnalysorContext.usePicker([
    'backgroundColor',
    'setBackgroundColor',
  ])

  /* ---------------- image sort ---------------- */
  const sortOptions = [
    {
      label: t('ns.name_sort'),
      value: 'name',
    },
    {
      label: t('ns.size_sort'),
      value: 'size',
    },
  ]

  const [sort, setSort] = useLocalStorageState<string[]>(localStorageEnum.LOCAL_STORAGE_SORT, {
    defaultValue: ['size', 'asc'],
  })

  const onSortChange = (value: string[]) => {
    setSort(value)
    setImages((t) => ({ list: [...sortImages(value, t.list)] }))

    // refresh images to make sure preview index is correct
    refreshImages({ type: 'sort' })
  }

  const sortImages = (sort: string[], images: ImageType[]) => {
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

  /* ---------------- image scale --------------- */
  const [containerRef] = useWheelScaleEvent()

  return (
    <div className={'space-y-6'} ref={containerRef}>
      <Card size='small' title={t('ns.settings')}>
        <div className={'flex flex-col space-y-4'}>
          <OperationItemUI title={t('ns.type')}>
            <DisplayType imageTypes={imageTypes} images={images} onImageTypeChange={onImageTypeChange} />
          </OperationItemUI>

          <OperationItemUI title={t('ns.group')}>
            <DisplayGroup
              options={groupType.map((item) => ({ label: item.label, value: item.value }))}
              value={displayGroup}
              onChange={setDisplayGroup}
            ></DisplayGroup>
          </OperationItemUI>

          <div className={'flex space-x-6'}>
            <OperationItemUI title={t('ns.sort')}>
              <DisplaySort options={sortOptions} value={sort} onChange={onSortChange} />
            </OperationItemUI>

            <OperationItemUI title={t('ns.background_color')}>
              <PrimaryColorPicker
                color={backgroundColor}
                onColorChange={setBackgroundColor}
                localKey={localStorageEnum.LOCAL_STORAGE_BACKGROUND_RECENT_COLORS_KEY}
                extraColors={[Colors.warmWhite, Colors.warmBlack]}
              />
            </OperationItemUI>
          </div>
        </div>
      </Card>
      <div>
        <Card
          size='small'
          loading={images.loading}
          headStyle={{ borderBottom: 'none' }}
          bodyStyle={images.loading ? {} : { padding: 0 }}
          title={t('ns.images')}
          extra={<ImageActions />}
        >
          <CollapseTree allDirs={dirs.all} allImageTypes={imageTypes.all} displayGroup={displayGroup} />
        </Card>
      </div>
      <Modal></Modal>
    </div>
  )
}
