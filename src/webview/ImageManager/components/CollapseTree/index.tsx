import { isNumber } from '@minko-fe/lodash-pro'
import { useMemoizedFn, useWhyDidYouUpdate } from '@minko-fe/react-hook'
import { type CollapseProps } from 'antd'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FaRegImages } from 'react-icons/fa'
import { IoMdFolderOpen } from 'react-icons/io'
import { PiFileImage } from 'react-icons/pi'
import { type ImageType } from '../..'
import ImageManagerContext from '../../contexts/ImageManagerContext'
import { type GroupType } from '../DisplayGroup'
import { type DisplayStyleType } from '../DisplayStyle'
import ImageCollapse from '../ImageCollapse'
import OpenFolder from './components/OpenFolder'
type CollapseTreeProps = {
  dirs: string[]
  imageTypes: string[]
  displayGroup: GroupType[]
  displayStyle: DisplayStyleType
}

type Flatten = 'all'

export type FileNode = {
  label: string
  value: string
  children: FileNode[]
  renderConditions?: Record<string, string>[]
  type?: GroupType | Flatten
  // for compactFolders
  renderList?: ImageType[]
}

function treeify(
  list: string[],
  options: {
    flatten?: boolean
    onGenerate?: (node: FileNode) => void
  },
) {
  const { flatten = false, onGenerate } = options
  const resultTree: FileNode[] = []

  if (flatten) {
    list.forEach((item) => {
      const node = {
        label: item,
        value: item,
        children: [],
      }
      onGenerate?.(node)
      resultTree.push(node)
    })
  } else {
    for (const file of list) {
      const paths = file.split('/')
      let currentNodes = resultTree
      paths.forEach((path, index) => {
        const find = currentNodes.find((item) => item.label === path)
        if (find) {
          currentNodes = find.children
        } else {
          const node = {
            label: path,
            value: paths.slice(0, index + 1).join('/'),
            children: [],
          }
          onGenerate?.(node)
          currentNodes.push(node)
          currentNodes = node.children
        }
      })
    }
  }

  return resultTree
}

type BuildRenderOption = {
  flatten?: boolean
  toBeBuild: Record<string, string[]>
}
function buildRenderTree(options: BuildRenderOption) {
  const { flatten, toBeBuild } = options
  let previousTree = [] as FileNode[]
  Object.keys(toBeBuild).forEach((d) => {
    previousTree = treeify(toBeBuild[d], {
      flatten,
      onGenerate: (n) => {
        n.type = d as GroupType

        if (!n.renderConditions) {
          n.renderConditions = [{ [d]: n.value }]
        }

        const p = previousTree.map((item) => ({
          ...item,
          renderConditions: [...(item.renderConditions || []), ...(n.renderConditions || [])],
        }))
        n.children.push(...p)
      },
    })
  })
  return previousTree
}

function CollapseTree(props: CollapseTreeProps) {
  const { dirs, imageTypes, displayGroup, displayStyle } = props
  const { images } = ImageManagerContext.usePicker(['images'])
  const { t } = useTranslation()

  useWhyDidYouUpdate('CollapseTree', props)

  const displayMap = useMemo(
    () => ({
      dir: {
        imagePrototype: 'dirPath',
        list: dirs,
        icon: (props: { path: string }) => (
          <OpenFolder {...props}>
            <IoMdFolderOpen />
          </OpenFolder>
        ),
        contextMenu: true,
      },
      type: {
        imagePrototype: 'fileType',
        list: imageTypes,
        icon: () => <PiFileImage />,
        contextMenu: false,
      },
      all: {
        icon: () => (
          <OpenFolder path=''>
            <FaRegImages />
          </OpenFolder>
        ),
        contextMenu: true,
      },
    }),
    [dirs, imageTypes],
  )

  const checkVaild = useMemoizedFn((childNode: FileNode, image: ImageType) => {
    return displayGroup.every((g) => {
      return childNode.renderConditions?.some((c) => {
        return c[g] === image[displayMap[g].imagePrototype]
      })
    })
  })

  const nestedDisplay = useMemoizedFn((tree: FileNode[], collapseProps?: CollapseProps) => {
    if (!tree.length) return null

    return (
      <div className={'space-y-2'}>
        {tree.map((node) => {
          // const _isLast = !node.children.length && Object.keys(node.renderConditions || []).length > 1
          const renderList = node.renderList || images.visibleList.filter((img) => checkVaild(node, img)) || []

          return (
            <ImageCollapse
              key={node.value}
              id={node.value}
              collapseProps={{
                // bordered: !isLast,
                bordered: false,
                ...collapseProps,
              }}
              labelContainer={(label) => (
                <div className={'flex items-center space-x-2'}>
                  <div className={'flex-center'}>{displayMap[node.type!].icon({ path: node.value })}</div>
                  {label}
                </div>
              )}
              contextMenu={displayMap[node.type!].contextMenu}
              label={node.label}
              images={renderList}
              nestedChildren={nestedDisplay(node.children)}
            ></ImageCollapse>
          )
        })}
      </div>
    )
  })

  const displayByPriority = useMemoizedFn(() => {
    const toBeBuild: BuildRenderOption['toBeBuild'] = {}
    displayGroup.forEach((g) => {
      toBeBuild[g] = displayMap[g].list
    })
    let tree = buildRenderTree({ toBeBuild, flatten: false })
    if (!tree.length) {
      tree = [
        {
          label: t('ia.all'),
          type: 'all',
          value: '',
          children: [],
        },
      ]
    }

    if (displayStyle === 'compact') {
      compactFolders(tree)
    }

    console.log('render tree', tree)
    // render tree
    return nestedDisplay(tree, { bordered: true })
  })

  const compactFolders = useMemoizedFn((tree: FileNode[]) => {
    tree.forEach((node) => {
      const { children } = node
      if (children.length > 1) {
        compactFolders(children)
      } else if (isNumber(children.length)) {
        const child = children[0] as FileNode | undefined
        const renderList = images.visibleList.filter((img) => checkVaild(node, img)) || undefined

        if (!renderList?.length) {
          Object.assign(node, {
            ...child,
            label: child ? `${node.label}/${child.label}` : node.label,
          })

          if (child?.children.length) {
            compactFolders(tree)
          }
        } else {
          node.renderList = renderList
          if (node?.children.length) {
            compactFolders(node.children)
          }
        }
      }
    })
  })

  return <>{displayByPriority()}</>
}

export default memo(CollapseTree)
