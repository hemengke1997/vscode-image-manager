import { isUndefined } from '@minko-fe/lodash-pro'
import { useControlledState, useMemoizedFn } from '@minko-fe/react-hook'
import { Collapse, type CollapseProps } from 'antd'
import { type ReactNode, memo, useEffect, useMemo } from 'react'
import { flushSync } from 'react-dom'
import { cn } from '~/webview/utils'
import ActionContext from '../../contexts/ActionContext'
import { type EnableCollapseContextMenuType } from '../ContextMenus/components/CollapseContextMenu'
import useCollapseContextMenu from '../ContextMenus/components/CollapseContextMenu/hooks/useCollapseContextMenu'
import useImageContextMenuEvent from '../ContextMenus/components/ImageContextMenu/hooks/useImageContextMenuEvent'
import ImagePreview, { type ImagePreviewProps } from '../ImagePreview'

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

  const { collapseOpen } = ActionContext.usePicker(['collapseOpen'])

  const [activeKeys, setActiveKeys] = useControlledState<string[]>({
    defaultValue: collapseProps.defaultActiveKey as string[],
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

  useImageContextMenuEvent({
    on: {
      reveal_in_viewer: (targetImage) => {
        if (targetImage && underFolderDeeplyImages?.find((image) => image.path === targetImage.path)) {
          flushSync(() => {
            setActiveKeys([id])
          })
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

  const singleLabelNode = useMemoizedFn((label: string, index: number) => {
    return (
      <div className={'w-full flex-1'}>
        <div
          onContextMenu={(e) => onContextMenu(e, index)}
          tabIndex={-1}
          className={cn(
            "relative w-full cursor-pointer transition-all after:absolute after:-inset-x-0 after:-inset-y-[8px] after:content-[''] hover:underline focus:underline",
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
            <div key={i} className={cn('flex items-center', i === labels.length - 1 && 'flex-1')}>
              {singleLabelNode(l, i)}
              {i !== labels.length - 1 && <div className={'px-0.5'}>/</div>}
            </div>
          ))}
        </div>
      )
    } else {
      // TODO: 哪些情况下，index 传 0 会出问题？
      return singleLabelNode(labels[0], 0)
    }
  })

  if (!images?.length && !nestedChildren) return null

  return (
    <>
      <Collapse
        destroyInactivePanel={false}
        {...collapseProps}
        activeKey={activeKeys}
        onChange={(keys) => onCollapseChange(keys as string[])}
        items={[
          {
            key: id,
            label: labelRender(generateLabel(labels)),
            children: images?.length ? (
              <div className={'space-y-2'}>
                <ImagePreview {...imagePreviewProps} images={images} />
                {nestedChildren}
              </div>
            ) : (
              nestedChildren
            ),
          },
        ]}
      ></Collapse>
    </>
  )
}

export default memo(ImageCollapse)
