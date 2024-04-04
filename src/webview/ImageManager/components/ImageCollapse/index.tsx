import { isUndefined } from '@minko-fe/lodash-pro'
import { useControlledState } from '@minko-fe/react-hook'
import { Collapse, type CollapseProps } from 'antd'
import { type ReactNode, memo, useEffect, useMemo } from 'react'
import { useContextMenu } from 'react-contexify'
import { mergeClass } from '~/webview/utils'
import ActionContext from '../../contexts/ActionContext'
import { COLLAPSE_CONTEXT_MENU_ID, type CollapseContextMenuType } from '../ContextMenus/components/CollapseContextMenu'
import ImagePreview, { type ImagePreviewProps } from '../ImagePreview'

type ImageCollapseProps = {
  collapseProps: CollapseProps
  label: string
  joinLabel: boolean
  labelContainer: (children: ReactNode) => ReactNode
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
  nestedChildren: JSX.Element | null
  id: string
  contextMenu?: CollapseContextMenuType
}

function ImageCollapse(props: ImageCollapseProps) {
  const {
    collapseProps,
    nestedChildren,
    labelContainer,
    label,
    joinLabel,
    images,
    underFolderImages,
    underFolderDeeplyImages,
    id,
    contextMenu,
  } = props

  const { collapseOpen } = ActionContext.usePicker(['collapseOpen'])

  const [activeKeys, setActiveKeys] = useControlledState<string[]>({
    defaultValue: collapseProps.defaultActiveKey as string[],
    onChange: collapseProps.onChange,
  })

  const onCollapseChange = (keys: string[]) => {
    setActiveKeys(keys)
  }

  const { show } = useContextMenu({ props: { targetPath: '' } })

  const basePath = useMemo(() => (joinLabel ? id.slice(0, id.lastIndexOf(label)) : id), [id, label, joinLabel])
  const labels = useMemo(() => label.split('/').filter(Boolean), [label])

  useEffect(() => {
    if (collapseOpen > 0) {
      setActiveKeys([id])
    } else if (collapseOpen < 0) {
      setActiveKeys([])
    }
  }, [collapseOpen])

  const getCurrentPath = (index: number | undefined) => {
    if (isUndefined(index)) return basePath
    return basePath + labels.slice(0, index + 1).join('/')
  }

  const singleLabelNode = (label: string, index: number) => {
    return (
      <div className={'w-full flex-1'}>
        <div
          onContextMenu={(e) => {
            if (!contextMenu) return

            show({
              event: e,
              id: COLLAPSE_CONTEXT_MENU_ID,
              props: {
                targetPath: getCurrentPath(index) || '',
                images: [images, underFolderImages].find((arr) => arr?.length),
                underFolderDeeplyImages,
                contextMenu,
              },
            })
          }}
          tabIndex={-1}
          className={mergeClass(
            "relative w-full cursor-pointer transition-all after:absolute after:-inset-y-[8px] after:-right-[12px] after:left-0 after:content-['']",
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
  }

  const generateLabel = (labels: string[]) => {
    if (labels.length > 1) {
      return (
        <div className={'flex w-full items-center'}>
          {labels.map((l, i) => (
            <div key={i} className={mergeClass('flex items-center', i === labels.length - 1 && 'flex-1')}>
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
  }

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
            label: labelContainer(generateLabel(labels)),
            children: images?.length ? (
              <div className={'space-y-2'}>
                <ImagePreview images={images} />
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
