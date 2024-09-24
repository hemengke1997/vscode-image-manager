import { memo, type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Element, scroller } from 'react-scroll'
import { styleObjectToString } from '@minko-fe/style-object-to-string'
import { useMemoizedFn } from 'ahooks'
import { useControlledState } from 'ahooks-x'
import { Collapse, type CollapseProps } from 'antd'
import { produce } from 'immer'
import { isUndefined } from 'lodash-es'
import { classNames } from 'tw-clsx'
import ActionContext from '../../contexts/action-context'
import GlobalContext from '../../contexts/global-context'
import useImageManagerEvent from '../../hooks/use-image-manager-event'
import useSticky from '../../hooks/use-sticky'
import { type EnableCollapseContextMenuType } from '../context-menus/components/collapse-context-menu'
import useCollapseContextMenu from '../context-menus/components/collapse-context-menu/hooks/use-collapse-context-menu'
import ImagePreview, { type ImagePreviewProps } from '../image-preview'
import SingleLabel from './components/single-label'
import './index.css'

type ImageCollapseProps = {
  /**
   * 透传给 antd collapse 的 props
   */
  collapseProps: CollapseProps
  /**
   * collapase展示的title
   */
  label: string
  /**
   * 是否在路径上添加label
   * 为了在os或exploerer中打开时层级深一层，避免再点进去一次
   */
  joinLabel: boolean
  /**
   * 增强label渲染
   */
  labelRender: (children: ReactNode) => ReactNode
  /**
   * 需要渲染的图片
   */
  images: ImagePreviewProps['images'] | undefined
  /**
   * 当前文件夹下的图片
   */
  underFolderImages: ImagePreviewProps['images'] | undefined
  /**
   * 当前文件夹下的所有图片（包括子目录）
   */
  underFolderDeeplyImages: ImagePreviewProps['images'] | undefined
  /**
   * 嵌套子组件
   */
  nestedChildren: JSX.Element | null
  /**
   * 目录绝对地址
   */
  id: string
  /**
   * collapse头部菜单上下文
   */
  contextMenu?: EnableCollapseContextMenuType
  /**
   * ImagePreview组件的透传prop
   */
  imagePreviewProps?: Partial<ImagePreviewProps>
}

function ImageCollapse(props: ImageCollapseProps) {
  const {
    collapseProps,
    nestedChildren,
    labelRender,
    label,
    joinLabel,
    images,
    underFolderImages,
    underFolderDeeplyImages,
    id,
    contextMenu,
    imagePreviewProps,
  } = props

  const { imageRevealWithoutQuery, viewerHeaderStickyHeight, dirReveal, setDirReveal } = GlobalContext.usePicker([
    'imageRevealWithoutQuery',
    'viewerHeaderStickyHeight',
    'dirReveal',
    'setDirReveal',
  ])

  const stickyRef = useRef<HTMLDivElement>(null)
  const holderRef = useRef<HTMLDivElement>(null)

  const getCollpaseHeader = () => stickyRef.current?.querySelector('.ant-collapse-header') as HTMLElement
  const isSticky = useRef(false)

  useEffect(() => {
    if (stickyRef.current) {
      const target = getCollpaseHeader()

      if (target) {
        target.tabIndex = -1
      }
    }
  }, [stickyRef])

  const onCollapseChange = useMemoizedFn((keys: string[]) => {
    setActiveKeys(keys)

    if (!keys.length) {
      // 关闭collapse
      // 如果sticky状态，需要滚动collapse的header到顶部
      if (isSticky.current) {
        scroller.scrollTo(id, {
          duration: 0,
          smooth: false,
          offset: -viewerHeaderStickyHeight,
          containerId: 'root',
        })
      }
    }
  })

  const { show } = useCollapseContextMenu()

  const basePath = useMemo(() => (joinLabel ? id.slice(0, id.lastIndexOf(label)) : id), [id, label, joinLabel])
  const labels = useMemo(() => label.split('/').filter(Boolean), [label])

  const { activeCollapseIdSet, setActiveCollapseIdSet } = ActionContext.usePicker([
    'activeCollapseIdSet',
    'setActiveCollapseIdSet',
  ])

  const [activeKeys, setActiveKeys] = useControlledState<string[]>({
    defaultValue: (collapseProps.defaultActiveKey as string[]) || [],
    value: collapseProps.activeKey as string[] | undefined,
    // 当 activeKeys 变化时，更新 activeCollapseIdSet
    onChange: (keys) => {
      setActiveCollapseIdSet(
        produce((draft) => {
          if (keys.length > 0) {
            draft.add(id)
          } else {
            draft.delete(id)
          }
        }),
      )
    },
  })

  useLayoutEffect(() => {
    if (collapseProps.defaultActiveKey) {
      setActiveCollapseIdSet(
        produce((draft) => {
          draft.add(id)
        }),
      )
    }
  }, [])

  useEffect(() => {
    if (activeCollapseIdSet.has(id) && !activeKeys.includes(id)) {
      setActiveKeys([id])
    } else if (!activeCollapseIdSet.has(id) && activeKeys.includes(id)) {
      setActiveKeys([])
    }
  }, [activeCollapseIdSet])

  const isActive = useMemoizedFn((imagePath: string) => {
    return imagePath && underFolderDeeplyImages?.find((image) => image.path === imagePath)
  })

  const onActive = useMemoizedFn((imagePath: string) => {
    if (isActive(imagePath)) {
      setActiveKeys([id])
    }
  })

  // 由于collapse的内容默认是不渲染的，
  // 所以需要在 `reveal_in_viewer` 的时候，主动触发collapse渲染
  useEffect(() => {
    if (!activeKeys.length) {
      onActive(imageRevealWithoutQuery)
    }
  }, [imageRevealWithoutQuery])

  useEffect(() => {
    if (id === dirReveal) {
      setDirReveal('')
      stickyRef.current?.scrollIntoView({
        behavior: 'instant',
        block: 'center',
      })
    }
  }, [id])

  useImageManagerEvent({
    on: {
      reveal_in_viewer: (image) => {
        onActive(image.path)
      },
      rename_directory: (previosDirPath, newPath) => {
        if (previosDirPath === id) {
          setDirReveal(newPath)
        }
      },
    },
  })

  const getCurrentPath = useMemoizedFn((index: number | undefined) => {
    if (isUndefined(index)) return basePath
    return basePath + labels.slice(0, index + 1).join('/')
  })

  const onContextMenu = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (!contextMenu) return

    show({
      event: e,
      props: {
        path: getCurrentPath(index) || '',
        images: [images, underFolderImages].find((arr) => arr?.length) || [],
        underFolderDeeplyImages: underFolderDeeplyImages || [],
        enable: contextMenu,
      },
    })
  })

  const onLabelClick = useMemoizedFn(() => {
    if (activeKeys?.length) {
      setActiveKeys([])
    } else {
      setActiveKeys([id])
    }
  })

  const generateLabel = useMemoizedFn((labels: string[]) => {
    if (labels.length > 1) {
      return (
        <div className={'flex w-full items-center'}>
          {labels.map((l, i) => (
            <div key={i} className={classNames('flex items-center', i === labels.length - 1 && 'flex-1')}>
              <SingleLabel
                index={i}
                contextMenu={!!contextMenu}
                onContextMenu={(e) => onContextMenu(e, i)}
                onClick={onLabelClick}
                dirPath={getCurrentPath(i)}
              >
                {l}
              </SingleLabel>
              <div className={classNames('px-0.5', i !== labels.length - 1 ? 'block' : 'hidden')}>/</div>
            </div>
          ))}
        </div>
      )
    } else {
      return (
        <SingleLabel
          onClick={onLabelClick}
          index={0}
          contextMenu={!!contextMenu}
          onContextMenu={(e) => onContextMenu(e, 0)}
          dirPath={id}
        >
          {labels[0]}
        </SingleLabel>
      )
    }
  })

  useSticky({
    target: getCollpaseHeader(),
    holder: holderRef.current,
    onStickyToogle(sticky, { rawStyle }) {
      isSticky.current = sticky
      if (sticky) {
        const style =
          styleObjectToString({
            zIndex: 4,
            top: `${viewerHeaderStickyHeight}px`,
            position: 'sticky',
            backgroundColor: 'var(--sticky-collapse-header-bgColor)',
            backdropFilter: 'blur(30px)',
            boxShadow: 'var(--ant-box-shadow)',
          }) || ''
        rawStyle += style
      }

      requestAnimationFrame(() => {
        getCollpaseHeader().setAttribute('style', rawStyle)
      })
    },
    topOffset: viewerHeaderStickyHeight,
    enable: !!(activeKeys.length && holderRef.current),
  })

  /**
   * hack
   * 解决非手动打开collapse时，sticky失效的问题
   */
  const [, update] = useState(0)
  useEffect(() => {
    if (activeKeys.length) {
      update((t) => ~t)
    }
  }, [activeKeys])

  if (!images?.length && !nestedChildren) return null

  return (
    <Element name={id}>
      <Collapse
        /**
         * 由于图片数量可能很多，如果打开了collapse之后，即使关闭了也会一直渲染
         * 所以需要在关闭的时候销毁inactive的panel
         */
        destroyInactivePanel
        {...collapseProps}
        ref={stickyRef}
        activeKey={activeKeys}
        onChange={(keys) => onCollapseChange(keys as string[])}
        items={[
          {
            forceRender: !!activeKeys.length,
            key: id,
            label: labelRender(generateLabel(labels)),
            children: images?.length ? (
              <div className={'space-y-2'}>
                <ImagePreview ref={holderRef} {...imagePreviewProps} images={images} />
                {nestedChildren}
              </div>
            ) : (
              nestedChildren
            ),
          },
        ]}
      ></Collapse>
    </Element>
  )
}

export default memo(ImageCollapse)
