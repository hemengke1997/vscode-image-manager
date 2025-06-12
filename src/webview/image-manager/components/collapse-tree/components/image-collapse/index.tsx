import './index.css'

import { memo, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Element, scroller } from 'react-scroll'
import { styleObjectToString } from '@minko-fe/style-object-to-string'
import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { useControlledState } from 'ahooks-x'
import { Collapse, type CollapseProps, type GetProps } from 'antd'
import { isUndefined } from 'es-toolkit'
import { produce } from 'immer'
import { classNames } from 'tw-clsx'
import type imageName from '../../../image-name'
import useImageManagerEvent, { IMEvent } from '../../../../hooks/use-image-manager-event'
import useSticky from '../../../../hooks/use-sticky'
import ActionStore from '../../../../stores/action-store'
import FileStore, { CopyType } from '../../../../stores/file-store'
import GlobalStore from '../../../../stores/global-store'
import { clearTimestamp } from '../../../../utils'
import { type EnableCollapseContextMenuType } from '../../../context-menus/components/collapse-context-menu'
import useCollapseContextMenu from '../../../context-menus/components/collapse-context-menu/hooks/use-collapse-context-menu'
import ImageGroup from '../../../image-group'
import SingleLabel from './components/single-label'

type ImageCollapseProps = {
  workspaceFolder: string
  /**
   * 透传给 antd collapse 的 props
   */
  collapseProps: CollapseProps
  /**
   * collapase展示的title
   */
  label: string
  /**
   * 增强label渲染
   */
  labelRender: (children: ReactNode) => ReactNode
  /**
   * 需要渲染的图片
   */
  images: ImageType[] | undefined
  /**
   * 当前文件夹下的图片
   */
  folderImages: ImageType[] | undefined
  /**
   * 当前文件夹下的所有图片（包括子目录）
   */
  subfolderImages: ImageType[] | undefined
  /**
   * 嵌套子组件
   */
  children: JSX.Element | null
  /**
   * 目录绝对地址
   */
  id: string
  /**
   * collapse头部菜单上下文
   */
  contextMenu: ((path: string) => EnableCollapseContextMenuType) | undefined
  /**
   * 是否可以展开
   */
  collapsible?: boolean
  /**
   * 强制展开
   */
  forceOpen?: boolean
  /**
   * 图片名称显示方式
   */
  tooltipDisplayFullPath: GetProps<typeof imageName>['tooltipDisplayFullPath']
}

/**
 * viewer 目录图片组件
 */
function ImageCollapse(props: ImageCollapseProps) {
  const {
    workspaceFolder,
    collapseProps,
    children,
    labelRender,
    label,
    images,
    folderImages,
    subfolderImages,
    id,
    contextMenu,
    collapsible = true,
    forceOpen,
    tooltipDisplayFullPath,
  } = props

  const { activeCollapseIdSet, setActiveCollapseIdSet } = ActionStore.useStore([
    'activeCollapseIdSet',
    'setActiveCollapseIdSet',
  ])

  const { imageReveal, viewerHeaderStickyHeight, dirReveal, setDirReveal, workspaceImages } = GlobalStore.useStore([
    'imageReveal',
    'viewerHeaderStickyHeight',
    'dirReveal',
    'setDirReveal',
    'workspaceImages',
  ])

  const sameWorkspaceImages = useMemo(() => {
    return workspaceImages.find((item) => item.workspaceFolder === workspaceFolder)?.images
  }, [workspaceImages])

  const stickyRef = useRef<HTMLDivElement>(null)
  const holderRef = useRef<HTMLDivElement>(null)

  // 获取collapse的header dom
  const getCollpaseHeader = () => stickyRef.current?.querySelector('.ant-collapse-header') as HTMLElement | null
  const isSticky = useRef(false)

  useEffect(() => {
    if (stickyRef.current) {
      const target = getCollpaseHeader()

      if (target) {
        // 不让header可获取焦点，避免点击header回车后有聚焦效果
        target.removeAttribute('tabindex')

        if (!collapsible) {
          target.style.cursor = 'auto'
        }
      }
    }
  }, [stickyRef])

  const onCollapseChange = useMemoizedFn((keys: string[]) => {
    if (!collapsible) return

    setOpen(!!keys.length)
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

  const { show, hideAll } = useCollapseContextMenu()

  const basePath = useMemo(() => id.slice(0, id.lastIndexOf(label)), [id, label])
  const labels = useMemo(() => label.split('/').filter(Boolean), [label])

  const onOpenChange = useMemoizedFn((open: boolean) => {
    setActiveCollapseIdSet(
      produce((draft) => {
        if (open) {
          draft.value.add(id)
        } else {
          draft.value.delete(id)
        }
      }),
    )
  })

  const [open, setOpen] = useControlledState<boolean>({
    value: forceOpen || activeCollapseIdSet.value.has(id),
    onChange: onOpenChange,
  })

  const onActive = useMemoizedFn((imagePaths: string[]) => {
    // 判断当前collapse是否active
    if (imagePaths.length && subfolderImages?.find((image) => imagePaths.includes(image.path))) {
      setOpen(true)
    }
  })

  // 由于collapse的内容默认是不渲染的，
  // 所以需要在 `reveal_in_viewer` 的时候，主动触发collapse渲染
  useEffect(() => {
    if (!open) {
      onActive([clearTimestamp(imageReveal)])
    }
  }, [imageReveal])

  useEffect(() => {
    // 如果此目录是需要打开的目录，需要把目录滚动到可视区域中间
    // 并且清空全局的dirReveal
    if (id === dirReveal) {
      setDirReveal('')
      stickyRef.current?.scrollIntoView({
        behavior: 'instant',
        block: 'center',
      })
    }
  }, [id])

  const { imageManagerEvent } = useImageManagerEvent({
    on: {
      [IMEvent.reveal_in_viewer]: (imagePath) => {
        onActive([imagePath])
      },
      [IMEvent.rename_directory]: (previousDirPath, newPath) => {
        if (previousDirPath === id) {
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

    const path = getCurrentPath(index) || ''

    show({
      event: e,
      props: {
        path,
        images: [images, folderImages].find((arr) => arr?.length) || [],
        subfolderImages: subfolderImages || [],
        enableContextMenu: contextMenu(path),
        onPaste: hideAll,
      },
    })
  })

  const onClick = useMemoizedFn(() => {
    if (!collapsible) return
    setOpen((t) => !t)
  })

  const generateLabel = useMemoizedFn((labels: string[]) => {
    if (labels.length > 1) {
      return (
        <div className={'flex w-full items-center'}>
          {labels.map((item, i) => (
            <div key={i} className={classNames('flex items-center', i === labels.length - 1 && 'flex-1')}>
              <SingleLabel
                index={i}
                contextMenu={contextMenu?.(getCurrentPath(i))}
                onContextMenu={(e) => onContextMenu(e, i)}
                onClick={onClick}
                dirPath={getCurrentPath(i)}
                className={classNames(collapsible && 'cursor-pointer')}
              >
                {item}
              </SingleLabel>
              <div className={classNames('px-0.5', i !== labels.length - 1 ? 'block' : 'hidden')}>/</div>
            </div>
          ))}
        </div>
      )
    } else {
      return (
        <SingleLabel
          onClick={onClick}
          index={0}
          contextMenu={contextMenu?.(id)}
          onContextMenu={(e) => onContextMenu(e, 0)}
          dirPath={id}
          className={classNames(collapsible && 'cursor-pointer')}
        >
          {labels[0]}
        </SingleLabel>
      )
    }
  })

  useSticky({
    target: getCollpaseHeader(),
    holder: holderRef,
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

      getCollpaseHeader()?.setAttribute('style', rawStyle)
    },
    topOffset: viewerHeaderStickyHeight,
    enable: open,
  })

  /**
   * hack
   * 解决非手动打开collapse时，sticky失效的问题
   */
  const [, update] = useState(0)
  useUpdateEffect(() => {
    if (open) {
      update((t) => ~t)
    }
  }, [open])

  // 全局的文件选择
  const { imageSelectedMap, setImageSelectedMap, imageSelected, imageCopied } = FileStore.useStore([
    'imageSelectedMap',
    'setImageSelectedMap',
    'imageSelected',
    'imageCopied',
  ])

  const onSelectedImagesChange = useMemoizedFn((images: ImageType[]) => {
    setImageSelectedMap(
      produce((draft) => {
        // 优化渲染
        if (!images.length && !draft.get(id)?.length) return
        draft.set(id, images)
      }),
    )
  })

  // 这是使用useCallback是为了能够在imageCopied改变时，触发lazyImageProps的渲染
  const isCutImage = useCallback(
    (image: ImageType) => {
      if (imageCopied?.type === CopyType.MOVE && imageCopied.list.length) {
        return imageCopied.list.some((item) => item.path === image.path)
      }
    },
    [imageCopied],
  )

  const onClearImageGroupSelected = useMemoizedFn(() => {
    imageManagerEvent.emit(IMEvent.clear_viewer_selected_images)
  })

  const lazyImageProps: GetProps<typeof ImageGroup>['lazyImageProps'] = useMemo(() => {
    return {
      // 剪切的图片添加透明度
      className: (image) => (isCutImage(image) ? classNames('opacity-50') : ''),
      inViewer: true,
      imageNameProps: {
        tooltipDisplayFullPath,
      },
    }
  }, [tooltipDisplayFullPath, isCutImage])

  const enableContextMenu: GetProps<typeof ImageGroup>['enableContextMenu'] = useMemo(() => {
    return {
      compress: true,
      format_conversion: true,
      crop: true,
      find_similar_in_all: true,
      find_similar_in_same_level: true,
      cut: true,
      copy: true,
      delete: true,
      rename: true,
      reveal_in_viewer: false,
    }
  }, [])

  const onMultipleSelectContextMenu = useMemoizedFn(() => {
    return imageSelected
  })

  if (!images?.length && !children) return null

  return (
    <Element name={id}>
      <Collapse
        {...collapseProps}
        /**
         * 由于图片数量可能很多，如果打开了collapse之后，即使关闭了也会一直渲染
         * 所以需要在关闭的时候销毁inactive的panel
         */
        destroyOnHidden
        ref={stickyRef}
        activeKey={open ? [id] : []}
        onChange={(keys) => onCollapseChange(keys as string[])}
        items={[
          {
            forceRender: open,
            key: id,
            label: labelRender(generateLabel(labels)),
            children: images?.length ? (
              <div className={classNames('space-y-2')}>
                <ImageGroup
                  ref={holderRef}
                  id={id}
                  selectedImages={imageSelectedMap.get(id) || []}
                  onSelectedImagesChange={onSelectedImagesChange}
                  enableMultipleSelect={true}
                  onMultipleSelectContextMenu={onMultipleSelectContextMenu}
                  enableContextMenu={enableContextMenu}
                  lazyImageProps={lazyImageProps}
                  images={images}
                  workspaceImages={sameWorkspaceImages}
                  onClearImageGroupSelected={onClearImageGroupSelected}
                  clearSelectedOnBlankClick={true}
                  inViewer={true}
                />
                {children}
              </div>
            ) : (
              children
            ),
          },
        ]}
      ></Collapse>
    </Element>
  )
}

export default memo(ImageCollapse)
