import { uniq } from '@minko-fe/lodash-pro'
import { useControlledState, useLocalStorageState } from '@minko-fe/react-hook'
import { type ReturnOfMessageCenter } from '@rootSrc/message'
import { CmdToVscode, CmdToWebview } from '@rootSrc/message/shared'
import { App, Card, ConfigProvider, Modal, theme } from 'antd'
import { type Stats } from 'node:fs'
import { startTransition, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { localStorageEnum } from '../local-storage'
import PrimaryColorPicker from '../ui-framework/src/components/CustomConfigProvider/components/PrimaryColorPicker'
import { vscodeApi } from '../vscode-api'
import CollapseTree from './components/CollapseTree'
import DisplayGroup, { type GroupType } from './components/DisplayGroup'
import DisplaySort from './components/DisplaySort'
import DisplayStyle, { type DisplayStyleType } from './components/DisplayStyle'
import DisplayType from './components/DisplayType'
import ImageActions from './components/ImageActions'
import ImageForSize from './components/ImageForSize'
import ImageManagerContext from './contexts/ImageManagerContext'
import useWheelScaleEvent from './hooks/useWheelScaleEvent'
import OperationItemUI from './ui/OperationItemUI'
import { filterVisibleImages } from './utils'
import { Colors } from './utils/color'
import 'react-contexify/ReactContexify.css'
import './index.css'

vscodeApi.registerEventListener()

// the visible of image is determined by 'visible' prop.
// at present, there are two filetr condition
// 1. type - image type (i.e png, jpg, gif)
// 2. size - image size (i.e 1kb)
type ImageVisibleFilterType = 'type' | 'size'

export type ImageType = Omit<ReturnOfMessageCenter<CmdToVscode.GET_ALL_IMAGES>['imgs'][number], 'stats'> & {
  stats: Stats
  // extra
  visible?: Partial<Record<ImageVisibleFilterType | string, boolean>>
}

export default function ImageManager() {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const { t } = useTranslation()

  const { images, setImages, imageRefreshedState, refreshImages } = ImageManagerContext.usePicker([
    'images',
    'setImages',
    'imageRefreshedState',
    'refreshImages',
  ])

  const [displayImageTypes, setDisplayImageTypes] = useLocalStorageState<string[]>(
    localStorageEnum.LOCAL_STORAGE_DISPLAY_TYPE,
    { defaultValue: [] },
  )

  const dirs = useMemo(() => filterVisibleImages(images.visibleList, (image) => image.dirPath), [images.visibleList])
  // const allDirs = useMemo(() => uniq(images.originalList.map((item) => item.dirPath)).sort(), [images.originalList])
  const imageTypes = useMemo(
    () => filterVisibleImages(images.visibleList, (image) => image.fileType),
    [images.visibleList],
  )

  const allImageTypes = useMemo(
    () => uniq(images.originalList.map((item) => item.fileType)).sort(),
    [images.originalList],
  )

  const { refreshTimes, refreshType } = imageRefreshedState

  useEffect(() => {
    const isRefresh = refreshTimes && refreshType === 'refresh'
    const messageKey = 'REFRESH_IMAGES'
    if (isRefresh) {
      message.loading({
        content: t('ia.img_refreshing'),
        key: messageKey,
      })
    }

    vscodeApi.postMessage({ cmd: CmdToVscode.GET_ALL_IMAGES }, (data) => {
      console.log(data, 'data')
      setImages({
        originalList: data.imgs as ImageType[],
        list: sortImages(sort!, data.imgs as ImageType[]),
        loading: false,
        basePath: data.workspaceFolder,
      })

      onImageTypeChange(data.fileTypes)

      if (isRefresh) {
        message.destroy(messageKey)
        message.success(t('ia.img_refreshed'))
      }
    })
  }, [refreshTimes])

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const message = e.data
      switch (message.cmd) {
        case CmdToWebview.IMAGES_CHANGED: {
          refreshImages({ type: 'slientRefresh' })
          break
        }
        default:
          break
      }
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [])

  /* ------------ image type checkbox ----------- */
  const onImageTypeChange = (checked: string[]) => {
    setDisplayImageTypes(checked)
    startTransition(() => {
      setImages((img) => ({
        list: img.list.map((t) => ({ ...t, visible: { ...t.visible, type: checked.includes(t.fileType) } })),
      }))
    })
  }

  /* ---------------- image group --------------- */
  const groupType: { label: string; value: GroupType; priority: number }[] = [
    {
      label: t('ia.group_by_dir'),
      value: 'dir',
      priority: 1, // highest
    },
    {
      label: t('ia.group_by_type'),
      value: 'type',
      priority: 2,
    },
  ]

  const [_displayGroup, _setDisplayGroup] = useLocalStorageState<GroupType[]>(
    localStorageEnum.LOCAL_STORAGE_DISPLAY_GROUP,
    {
      defaultValue: ['dir'],
    },
  )

  const sortGroup = (group: GroupType[]) => {
    const allGroupType = groupType.map((item) => item.value)
    group = uniq(group.filter((item) => allGroupType.includes(item)))
    if (group.length > 1) {
      const findPriority = (v: GroupType) => {
        return groupType.find((item) => item.value === v)?.priority || 0
      }
      group = group.sort((a, b) => {
        return findPriority(b) - findPriority(a)
      })
    }
    return group
  }
  const [displayGroup, setDisplayGroup] = useControlledState({
    defaultValue: sortGroup(_displayGroup!),
    value: sortGroup(_displayGroup!),
    onChange: (group) => {
      group = sortGroup(group)
      _setDisplayGroup(group)
    },
  })

  const { backgroundColor, setBackgroundColor } = ImageManagerContext.usePicker([
    'backgroundColor',
    'setBackgroundColor',
  ])

  /* ---------------- image sort ---------------- */
  const sortOptions = [
    {
      label: t('ia.name_sort'),
      value: 'name',
    },
    {
      label: t('ia.size_sort'),
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

  /* ------ display style (flat | neseted) ------ */
  const [displayStyle, setDisplayStyle] = useLocalStorageState<DisplayStyleType>(
    localStorageEnum.LOCAL_STORAGE_DISPLAY_STYLE,
    {
      defaultValue: 'compact',
    },
  )

  /* ---------------- image scale --------------- */
  const [containerRef] = useWheelScaleEvent()

  return (
    <div className={'space-y-6'} ref={containerRef}>
      <Card size='small' title={t('ia.settings')}>
        <div className={'flex flex-col space-y-4'}>
          <OperationItemUI title={t('ia.type')}>
            <DisplayType
              imageTypes={{
                all: allImageTypes,
                checked: displayImageTypes!,
              }}
              images={images}
              onImageTypeChange={onImageTypeChange}
            />
          </OperationItemUI>

          <div className={'flex space-x-6'}>
            <OperationItemUI title={t('ia.group')}>
              <DisplayGroup
                options={groupType.map((item) => ({ label: item.label, value: item.value }))}
                value={displayGroup}
                onChange={setDisplayGroup}
              ></DisplayGroup>
            </OperationItemUI>
            <OperationItemUI title={t('ia.style')}>
              <DisplayStyle value={displayStyle} onChange={setDisplayStyle} />
            </OperationItemUI>
          </div>

          <div className={'flex space-x-6'}>
            <OperationItemUI title={t('ia.sort')}>
              <DisplaySort options={sortOptions} value={sort} onChange={onSortChange} />
            </OperationItemUI>
            <OperationItemUI title={t('ia.background_color')}>
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
          title={t('ia.images')}
          extra={<ImageActions />}
        >
          <ConfigProvider
            theme={{
              components: {
                Collapse: {
                  motionDurationMid: token.motionDurationFast,
                },
              },
            }}
          >
            <CollapseTree
              displayStyle={displayStyle!}
              dirs={dirs}
              imageTypes={imageTypes}
              displayGroup={displayGroup}
            />
          </ConfigProvider>
        </Card>
      </div>

      <ImageForSize />
      <Modal></Modal>
    </div>
  )
}
