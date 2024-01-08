import { uniq } from '@minko-fe/lodash-pro'
import { CmdToVscode, CmdToWebview } from '@rootSrc/message/shared'
import { App, Card, ConfigProvider, theme } from 'antd'
import { AnimatePresence, motion } from 'framer-motion'
import { type Stats } from 'node:fs'
import { type ParsedPath } from 'node:path'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { localStorageEnum } from '../local-storage'
import PrimaryColorPicker from '../ui-framework/src/components/CustomConfigProvider/components/PrimaryColorPicker'
import GlobalContext from '../ui-framework/src/contexts/GlobalContext'
import { vscodeApi } from '../vscode-api'
import CollapseTree from './components/CollapseTree'
import DisplayGroup, { type GroupType } from './components/DisplayGroup'
import DisplaySort from './components/DisplaySort'
import DisplayStyle from './components/DisplayStyle'
import DisplayType from './components/DisplayType'
import ImageActions from './components/ImageActions'
import CollapseContextMenu from './components/ImageCollapse/components/CollapseContextMenu'
import ImageForSize from './components/ImageForSize'
import ImageContextMenu from './components/LazyImage/components/ImageContextMenu'
import ImageManagerContext from './contexts/ImageManagerContext'
import SettingsContext from './contexts/SettingsContext'
import TreeContext from './contexts/TreeContext'
import useWheelScaleEvent from './hooks/useWheelScaleEvent'
import OperationItemUI from './ui/OperationItemUI'
import { Colors } from './utils/color'
import './index.css'
import 'react-contexify/ReactContexify.css'

vscodeApi.registerEventListener()

// the visible of image is determined by 'visible' prop.
// at present, there are two filetr condition
// 1. type - image type (i.e png, jpg, gif)
// 2. size - image size (i.e 1kb)
type ImageVisibleFilterType = 'type' | 'size'

export type ImageType = {
  name: string
  path: string
  stats: Stats
  dirPath: string
  fileType: string
  vscodePath: string
  workspaceFolder: string
  absWorkspaceFolder: string
  absDirPath: string
  basePath: string
  extraPathInfo: ParsedPath
} & {
  // extra
  visible?: Partial<Record<ImageVisibleFilterType | string, boolean>>
}

export default function ImageManager() {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const { t } = useTranslation()

  const { mode } = GlobalContext.usePicker(['mode'])

  const { imageState, setImageState, imageRefreshedState, refreshImages } = ImageManagerContext.usePicker([
    'imageState',
    'setImageState',
    'imageRefreshedState',
    'refreshImages',
  ])

  const {
    sort,
    setSort,
    displayStyle,
    setDisplayStyle,
    displayGroup,
    setDisplayGroup,
    displayImageTypes,
    setDisplayImageTypes,
  } = SettingsContext.useSelector((ctx) => ctx)

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

    vscodeApi.postMessage({ cmd: CmdToVscode.GET_ALL_IMAGES }, ({ data, workspaceFolders }) => {
      console.log(data, 'data')
      setImageState({
        data,
        workspaceFolders,
        loading: false,
      })

      onImageTypeChange(data.flatMap((item) => item.fileTypes))

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
  const allImageTypes = useMemo(() => uniq(imageState.data.flatMap((item) => item.fileTypes)), [imageState.data])
  const allImageFiles = useMemo(() => imageState.data.flatMap((item) => item.imgs), [imageState.data])

  const onImageTypeChange = (checked: string[]) => {
    setDisplayImageTypes(checked)
  }

  /* ---------------- image group --------------- */
  const groupType: { label: string; value: GroupType; hidden?: boolean }[] = useMemo(
    () => [
      {
        label: 'TODO: workspace',
        value: 'workspace',
        hidden: true,
      },
      {
        label: t('ia.group_by_dir'),
        value: 'dir',
      },
      {
        label: t('ia.group_by_type'),
        value: 'type',
      },
    ],
    [],
  )

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

  const onSortChange = (value: string[]) => {
    setSort(value)
  }

  /* ---------------- image scale --------------- */
  const [containerRef] = useWheelScaleEvent()

  return (
    <div ref={containerRef} className={'space-y-4'}>
      <AnimatePresence>
        {mode === 'standard' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Card size='small' title={t('ia.settings')}>
              <div className={'flex flex-col space-y-4'}>
                <OperationItemUI title={t('ia.type')}>
                  <DisplayType
                    imageTypes={{
                      all: allImageTypes,
                      checked: displayImageTypes!,
                    }}
                    images={allImageFiles}
                    onImageTypeChange={onImageTypeChange}
                  />
                </OperationItemUI>

                <div className={'flex space-x-6'}>
                  <OperationItemUI title={t('ia.group')}>
                    <DisplayGroup
                      options={groupType
                        .filter((t) => !t.hidden)
                        .map((item) => ({ label: item.label, value: item.value }))}
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
          </motion.div>
        )}
      </AnimatePresence>

      <Card
        loading={imageState.loading}
        headStyle={{ borderBottom: 'none' }}
        bodyStyle={imageState.loading ? {} : { padding: 0 }}
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
          <div className={'space-y-4'}>
            {imageState.data.map((item, index) => (
              <TreeContext.Provider
                key={index}
                value={{
                  imageList: item.imgs,
                }}
              >
                <TreeContext.Consumer>
                  {({ dirs, imageTypes, workspaceFolders }) => (
                    <CollapseTree
                      workspaceFolders={workspaceFolders}
                      displayStyle={displayStyle!}
                      dirs={dirs}
                      imageTypes={imageTypes}
                      displayGroup={displayGroup}
                    />
                  )}
                </TreeContext.Consumer>
              </TreeContext.Provider>
            ))}
          </div>
        </ConfigProvider>
      </Card>
      <ImageContextMenu />
      <CollapseContextMenu />
      <ImageForSize />
    </div>
  )
}
