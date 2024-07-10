import { isUndefined } from '@minko-fe/lodash-pro'
import { useControlledState, useMemoizedFn } from '@minko-fe/react-hook'
import { styleObjectToString } from '@minko-fe/style-object-to-string'
import { Collapse, type CollapseProps } from 'antd'
import { type ReactNode, memo, useEffect, useMemo, useRef, useState } from 'react'
import { classnames } from 'tw-clsx'
import ActionContext from '../../contexts/action-context'
import GlobalContext from '../../contexts/global-context'
import { useSticky } from '../../hooks/use-sticky'
import { type EnableCollapseContextMenuType } from '../context-menus/components/collapse-context-menu'
import useCollapseContextMenu from '../context-menus/components/collapse-context-menu/hooks/use-collapse-context-menu'
import useImageContextMenuEvent from '../context-menus/components/image-context-menu/hooks/use-image-context-menu-event'
import ImagePreview, { type ImagePreviewProps } from '../image-preview'

type ImageCollapseProps = {
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
   * image dir path
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

  const { imageRevealWithoutQuery, viewerHeaderStickyHeight } = GlobalContext.usePicker([
    'imageRevealWithoutQuery',
    'viewerHeaderStickyHeight',
  ])
  const { collapseOpen } = ActionContext.usePicker(['collapseOpen'])

  const [activeKeys, setActiveKeys] = useControlledState<string[]>({
    defaultValue: (collapseProps.defaultActiveKey as string[]) || [],
    onChange: collapseProps.onChange,
  })

  const onCollapseChange = useMemoizedFn((keys: string[]) => {
    setActiveKeys(keys)
  })

  const { show } = useCollapseContextMenu()

  const basePath = useMemo(() => (joinLabel ? id.slice(0, id.lastIndexOf(label)) : id), [id, label, joinLabel])
  const labels = useMemo(() => label.split('/').filter(Boolean), [label])

  useEffect(() => {
    if (collapseOpen > 0) {
      setActiveKeys([id])
    } else if (collapseOpen < 0) {
      setActiveKeys([])
    }
  }, [collapseOpen])

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

  useImageContextMenuEvent({
    on: {
      reveal_in_viewer: (image) => {
        onActive(image.path)
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

  const singleLabelNode = useMemoizedFn((label: string, index: number) => {
    return (
      <div className={'w-full flex-1'}>
        <div
          onContextMenu={(e) => onContextMenu(e, index)}
          tabIndex={-1}
          className={classnames(
            'relative w-full cursor-pointer transition-all after:absolute after:-inset-x-0 after:-inset-y-[8px] after:content-[""] hover:underline focus:underline',
          )}
          onClick={() => {
            if (activeKeys?.length) {
              setActiveKeys([])
            } else {
              setActiveKeys([id])
            }
          }}
        >
          {label}
        </div>
      </div>
    )
  })

  const generateLabel = useMemoizedFn((labels: string[]) => {
    if (labels.length > 1) {
      return (
        <div className={'flex w-full items-center'}>
          {labels.map((l, i) => (
            <div key={i} className={classnames('flex items-center', i === labels.length - 1 && 'flex-1')}>
              {singleLabelNode(l, i)}
              <div className={classnames('px-0.5', i !== labels.length - 1 ? 'block' : 'hidden')}>/</div>
            </div>
          ))}
        </div>
      )
    } else {
      return singleLabelNode(labels[0], 0)
    }
  })

  const stickyRef = useRef<HTMLDivElement>(null)
  const holderRef = useRef<HTMLDivElement>(null)

  const target = stickyRef.current?.querySelector('.ant-collapse-header') as HTMLElement

  useSticky({
    target,
    holder: holderRef.current,
    onStickyToogle(sticky, { style: rawStyle }) {
      if (sticky) {
        const style =
          styleObjectToString({
            zIndex: 4,
            top: `${viewerHeaderStickyHeight}px`,
            position: 'sticky',
            backgroundColor: 'var(--custom-contexify-menu-bgColor)',
            backdropFilter: 'blur(200px)',
            boxShadow: 'var(--ant-box-shadow)',
          }) || ''
        target.setAttribute('style', rawStyle + style)
      } else {
        target.setAttribute('style', rawStyle)
      }
    },
    topOffset: viewerHeaderStickyHeight,
    enable: !!(activeKeys.length && holderRef.current),
  })

  const [fresh, setFresh] = useState(0)
  useEffect(() => {
    setFresh((t) => ~t)
  }, [activeKeys])

  if (!images?.length && !nestedChildren) return null

  return (
    <div>
      {/* hack，解决sticky失效的问题 */}
      <div className={'hidden'}>{fresh}</div>
      <Collapse
        /**
         * 由于图片数量可能很多，如果打开了collapse之后，即使关闭了也会一直渲染
         * 所以需要在关闭的时候销毁inactive的panel
         */
        destroyInactivePanel
        {...collapseProps}
        activeKey={activeKeys}
        onChange={(keys) => onCollapseChange(keys as string[])}
        ref={stickyRef}
        items={[
          {
            forceRender: !!activeKeys.length,
            key: id,
            label: labelRender(generateLabel(labels)),
            children: images?.length ? (
              <div className={'space-y-2'}>
                <ImagePreview ref={holderRef} {...imagePreviewProps} images={images} enableMultipleSelect />
                {nestedChildren}
              </div>
            ) : (
              nestedChildren
            ),
          },
        ]}
      ></Collapse>
    </div>
  )
}

export default memo(ImageCollapse)
