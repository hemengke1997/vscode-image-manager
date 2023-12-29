import { TinyColor } from '@ctrl/tinycolor'
import { castArray, isNil, isObject, some } from '@minko-fe/lodash-pro'
import { useLocalStorageState, useSetState } from '@minko-fe/react-hook'
import { CmdToVscode } from '@root/message/shared'
import {
  App,
  Badge,
  Button,
  Card,
  Checkbox,
  Collapse,
  ConfigProvider,
  Form,
  Image,
  InputNumber,
  Modal,
  Popover,
  Space,
  theme,
} from 'antd'
import { type CheckboxValueType } from 'antd/es/checkbox/Group'
import classNames from 'classnames'
import { motion } from 'framer-motion'
import { type Dirent, type Stats } from 'node:fs'
import { startTransition, useEffect, useLayoutEffect, useRef, useState } from 'react'
// import { isHotkeyPressed, useHotkeys } from 'react-hotkeys-hook'
import { MdImageSearch } from 'react-icons/md'
import { RiFilter2Line } from 'react-icons/ri'
import { TbLayoutNavbarExpand } from 'react-icons/tb'
import PrimaryColorPicker from '../ui-framework/src/components/ThemeProvider/components/PrimaryColorPicker'
import { vscodeApi } from '../vscode-api'
import DisplayGroup, { type DisplayType } from './components/DisplayGroup'
import DisplaySort from './components/DisplaySort'
import LazyImage from './components/LazyImage'
import ImageAnalysorContext from './context/ImageAnalysorContext'
import OperationItem from './ui/OperationItem'
import { bytesToKb } from './utils'
import {
  LOCAL_STORAGE_BACKGROUND_COLOR_KEY,
  LOCAL_STORAGE_BACKGROUND_RECENT_COLORS_KEY,
  LOCAL_STORAGE_DISPLAY_TYPE,
  LOCAL_STORAGE_IMAGE_SIZE_SCALE,
  LOCAL_STORAGE_SORT,
} from './utils/local-storage'
import styles from './index.module.css'

vscodeApi.registerEventListener()

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
  visible: Partial<Record<ImageFilterType, boolean>> | undefined
}

type ImageFilterType = 'type' | 'size'

type AllDisplayType = DisplayType | 'flatten'

export default function ImageAnalysor() {
  const { token } = theme.useToken()
  const { message } = App.useApp()

  const { config } = ImageAnalysorContext.usePicker(['config'])

  // fetch image from vscode
  const [images, setImages] = useSetState<{
    originalList: ImageType[]
    list: ImageType[]
    loading: boolean
  }>({ originalList: [], list: [], loading: true })

  const [imageTypes, setImageTypes] = useSetState<{
    all: string[]
    checked: CheckboxValueType[]
  }>({ all: [], checked: [] })

  const [dirs, setDirs] = useState<string[]>()

  useEffect(() => {
    vscodeApi.postMessage({ cmd: CmdToVscode.GET_ALL_IMAGES }, (data) => {
      setImages({ originalList: data.imgs, list: sortImages(sort!, data.imgs), loading: false })

      setDirs(data.dirs.sort())
      setImageTypes({
        all: data.fileTypes,
        checked: data.fileTypes,
      })

      setCollapseActiveKeys({
        dir: data.dirs.sort(),
        type: data.fileTypes,
      })
    })

    console.log(vscodeApi.getState(), 'state')
  }, [])

  /* ------------ image type checkbox ----------- */
  const onImageTypeChange = (checked: CheckboxValueType[]) => {
    setImageTypes({ checked })
    startTransition(() => {
      setImages((img) => ({
        list: img.list.map((t) => ({ ...t, visible: { ...t.visible, type: checked.includes(t.fileType) } })),
      }))
    })
  }

  const imageTypeOptions = () => {
    return imageTypes.all.map((item) => {
      return {
        label: (
          <div className={'space-x-2'}>
            <span>{item}</span>
            <Badge
              overflowCount={Number.POSITIVE_INFINITY}
              status='success'
              color={token.colorPrimary}
              count={images?.originalList.filter((t) => t.fileType === item).length}
              showZero
            />
          </div>
        ),
        value: item,
      }
    })
  }

  /* ---------------- image group --------------- */
  const groupType = [
    {
      label: 'Group by dir',
      value: 'dir',
      priority: 1, // highest
    },
    {
      label: 'Group by type',
      value: 'type',
      priority: 2,
    },
  ] as const

  const [display, setDisplay] = useLocalStorageState<AllDisplayType[]>(LOCAL_STORAGE_DISPLAY_TYPE, {
    defaultValue: ['dir'],
  })
  const displayMap: Record<AllDisplayType, { label: string; children: ImageType[] }[] | undefined> = {
    dir: dirs?.map((dir) => ({ label: dir, children: images.list.filter((t) => t.dirPath === dir) })),
    type: imageTypes.all.map((type) => ({ label: type, children: images.list.filter((t) => t.fileType === type) })),
    flatten: ['flatten'].map((f) => ({ label: f, children: images.list })),
  }

  const displayByPriority = () => {
    if (display?.length) {
      return nestedDisplay(display.sort()[0], display.sort())
    } else {
      return nestedDisplay('flatten', [])
    }
  }

  const [preview, setPreview] = useSetState<Record<string, { open?: boolean; current?: number } | undefined>>({})

  // default open all collapse
  const [collapseActiveKeys, setCollapseActiveKeys] = useSetState<Record<AllDisplayType | string, string[]>>({
    dir: dirs || [],
    type: imageTypes.all || [],
    flatten: ['flatten'],
  })

  const nestedDisplay = (displayType: AllDisplayType, all: AllDisplayType[]) => {
    if (!displayMap[displayType]) return null

    const currentIndex = all.indexOf(displayType)
    const hasMore = currentIndex < all.length - 1

    const tinyBackgroundColor = new TinyColor(backgroundColor)
    const isDark = tinyBackgroundColor.isDark()

    return (
      <ConfigProvider theme={{ components: { Collapse: { contentPadding: 0 } } }}>
        <Collapse
          className={classNames(hasMore ? styles.collapseNested : styles.collapse)}
          bordered={hasMore}
          activeKey={collapseActiveKeys[displayType]}
          onChange={(activeKeys) => setCollapseActiveKeys({ [displayType]: castArray(activeKeys) })}
          items={displayMap[displayType]
            ?.filter((t) => t.children.length)
            ?.map((item) => ({
              key: item.label,
              label: item.label,
              children: hasMore ? (
                nestedDisplay(all[currentIndex + 1], all)
              ) : (
                <motion.div className={'mx-auto flex flex-wrap gap-6'}>
                  <ConfigProvider
                    theme={{
                      components: {
                        Image: {
                          previewOperationColor: isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
                          previewOperationColorDisabled: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
                          previewOperationHoverColor: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
                          colorTextLightSolid: isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
                        },
                      },
                    }}
                  >
                    <Image.PreviewGroup
                      preview={{
                        visible: preview?.[item.label]?.open,
                        maskClosable: false,
                        movable: false,
                        style: {
                          backgroundColor: new TinyColor(backgroundColor).setAlpha(0.9).toRgbString(),
                        },
                        onVisibleChange: (v, _, current) => {
                          if (!v) {
                            setPreview({
                              [item.label]: { open: v },
                            })
                            return
                          }
                          if (current === preview?.[item.label]?.current) {
                            setPreview({ [item.label]: { open: v, current } })
                            return
                          }
                          if (v) return
                        },
                        maxScale: 10,
                        minScale: 0.1,
                        scaleStep: 0.3,
                      }}
                    >
                      <ConfigProvider
                        theme={{
                          components: {
                            Image: {
                              colorTextLightSolid: token.colorTextLightSolid,
                            },
                          },
                        }}
                      >
                        {item.children
                          .filter((c) => {
                            if (isObject(c.visible)) {
                              return Object.keys(c.visible).every((k) => c.visible?.[k as ImageFilterType])
                            }
                            return true
                          })
                          .map((t, i) => (
                            <LazyImage
                              image={{
                                style: { backgroundColor },
                                width: BASE_SIZE * scale!,
                                height: BASE_SIZE * scale!,
                                src: t.vscodePath,
                              }}
                              preview={preview?.[item.label]}
                              onPreviewChange={(p) => {
                                setPreview({ [item.label]: p })
                              }}
                              info={t}
                              index={i}
                              key={t.path}
                            />
                          ))}
                      </ConfigProvider>
                    </Image.PreviewGroup>
                  </ConfigProvider>
                </motion.div>
              ),
            }))}
          collapsible='icon'
          size='small'
        ></Collapse>
      </ConfigProvider>
    )
  }

  /* ---------------- image sort ---------------- */
  const sortOptions = [
    {
      label: 'name',
      value: 'name',
    },
    {
      label: 'size',
      value: 'size',
    },
  ]

  const [sort, setSort] = useLocalStorageState<string[]>(LOCAL_STORAGE_SORT, { defaultValue: ['size', 'asc'] })
  const onSortChange = (value: string[]) => {
    setSort(value)
    setImages((t) => ({ list: [...sortImages(value, t.list)] }))
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

  /* ------------- image background ------------- */
  const [backgroundColor, setBackgroundColor] = useLocalStorageState<string>(LOCAL_STORAGE_BACKGROUND_COLOR_KEY, {
    defaultValue: '#fff',
  })

  /* ---------------- image scale --------------- */
  const BASE_SIZE = config.imageDefaultWidth
  const [scale, setScale] = useLocalStorageState<number>(LOCAL_STORAGE_IMAGE_SIZE_SCALE, { defaultValue: 1 })

  const closeDefault = (e: Event) => {
    if (e.preventDefault) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const handleWheel = (event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      closeDefault(event)

      const delta = event.deltaY

      const scaleStep = config.scaleStep

      if (delta > 0) {
        setScale((prevScale) => Math.max(0.3, prevScale! - scaleStep))
      } else if (delta < 0) {
        setScale((prevScale) => Math.min(3, prevScale! + scaleStep))
      }
      return false
    }
  }

  const containerRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    containerRef.current?.addEventListener('wheel', handleWheel, { passive: false })
    return () => containerRef?.current?.removeEventListener('wheel', handleWheel)
  }, [])

  /* --------------- image actions -------------- */
  const [sizeForm] = Form.useForm()
  const filterImagesBySize = (value: { min?: number; max?: number }) => {
    const { min, max } = value
    if (isNil(min) && isNil(max)) {
      setImages((img) => ({
        list: img.list.map((t) => ({ ...t, visible: { ...t.visible, size: true } })),
      }))
    } else {
      setImages((img) => ({
        list: img.list.map((t) => ({
          ...t,
          visible: {
            ...t.visible,
            size: bytesToKb(t.stats.size) >= (min || 0) && bytesToKb(t.stats.size) <= (max || Number.POSITIVE_INFINITY),
          },
        })),
      }))
    }
  }

  const sizeFiltered = some(sizeForm.getFieldsValue(), (v) => !isNil(v))

  const imageActions = () => {
    return (
      <div className={'space-x-2'}>
        <Button
          type='text'
          icon={
            <div className={'flex-center text-xl'}>
              <MdImageSearch />
            </div>
          }
          onClick={() => message.info('Working in progress 🙌')}
        ></Button>
        <Popover
          trigger={'click'}
          content={
            <>
              <Form
                layout='inline'
                name='size'
                form={sizeForm}
                onFinishFailed={({ errorFields }) => {
                  errorFields.some((item) => {
                    if (item.errors.length) {
                      message.error(item.errors[0])
                      return true
                    }
                    return false
                  })
                }}
                onFinish={(value) => {
                  filterImagesBySize(value)
                }}
              >
                <div className={'flex-center space-x-2'}>
                  <div>Size</div>
                  <Space.Compact>
                    <Form.Item
                      noStyle
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const max = getFieldValue('max')
                            if (!isNil(max) && !isNil(value) && value > max) {
                              return Promise.reject(new Error('min must less than max'))
                            }
                            return Promise.resolve()
                          },
                        }),
                      ]}
                      dependencies={['max']}
                      name={'min'}
                    >
                      <InputNumber placeholder='min(kb)' min={0} onPressEnter={sizeForm.submit} />
                    </Form.Item>
                    <Form.Item
                      noStyle
                      name={'max'}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const min = getFieldValue('min')
                            if (!isNil(min) && !isNil(value) && value < min) {
                              return Promise.reject()
                            }
                            return Promise.resolve()
                          },
                        }),
                      ]}
                      dependencies={['min']}
                    >
                      <InputNumber placeholder='max(kb)' min={0} onPressEnter={sizeForm.submit} />
                    </Form.Item>
                  </Space.Compact>
                  <Form.Item noStyle>
                    <Button.Group>
                      <Button size='small' type='primary' onClick={() => sizeForm.submit()}>
                        Submit
                      </Button>
                      <Button
                        size='small'
                        type='default'
                        onClick={() => {
                          sizeForm.resetFields()
                          sizeForm.submit()
                        }}
                      >
                        Reset
                      </Button>
                    </Button.Group>
                  </Form.Item>
                </div>
              </Form>
            </>
          }
        >
          <Button
            type={sizeFiltered ? 'dashed' : 'text'}
            icon={
              <div className={'flex-center text-xl'}>
                <RiFilter2Line />
              </div>
            }
          />
        </Popover>
        <Popover
          trigger='click'
          content={
            <div>
              <div className={'flex-center space-x-2'}>
                <div>Layout</div>
                <Button.Group>
                  <Button
                    onClick={() => {
                      setCollapseActiveKeys({ dir: dirs || [], type: imageTypes.all || [], flatten: ['flatten'] })
                    }}
                  >
                    Expand
                  </Button>
                  <Button onClick={() => setCollapseActiveKeys({ dir: [], type: [], flatten: [] })}>Collapse</Button>
                </Button.Group>
              </div>
            </div>
          }
        >
          <Button
            type='text'
            icon={
              <div className={'flex-center text-xl'}>
                <TbLayoutNavbarExpand />
              </div>
            }
          />
        </Popover>
      </div>
    )
  }

  return (
    <div className={'space-y-6'} ref={containerRef}>
      <Card size='small' title='Settings'>
        <div className={'flex flex-col space-y-4'}>
          <OperationItem title='Type'>
            <Checkbox.Group
              value={imageTypes.checked}
              onChange={onImageTypeChange}
              options={imageTypeOptions()}
            ></Checkbox.Group>
          </OperationItem>

          <OperationItem title='Group'>
            <DisplayGroup
              options={groupType.map((item) => ({ label: item.label, value: item.value }))}
              value={display}
              onChange={setDisplay}
            ></DisplayGroup>
          </OperationItem>

          <div className={'flex space-x-6'}>
            <OperationItem title='Sort'>
              <DisplaySort options={sortOptions} value={sort} onChange={onSortChange} />
            </OperationItem>

            <OperationItem title='BackgroundColor'>
              <PrimaryColorPicker
                color={backgroundColor}
                onColorChange={setBackgroundColor}
                localKey={LOCAL_STORAGE_BACKGROUND_RECENT_COLORS_KEY}
                extraColors={['#fff', '#000']}
              />
            </OperationItem>
          </div>
        </div>
      </Card>
      <div>
        <Card
          size='small'
          loading={images.loading}
          headStyle={{ borderBottom: 'none' }}
          bodyStyle={{ padding: 0 }}
          title='Images'
          extra={imageActions()}
        >
          {displayByPriority()}
        </Card>
      </div>
      <Modal></Modal>
    </div>
  )
}
