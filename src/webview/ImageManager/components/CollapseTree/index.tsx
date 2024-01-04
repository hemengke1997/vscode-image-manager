import { type CollapseProps } from 'antd'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { FaRegImages } from 'react-icons/fa'
import { IoMdFolderOpen } from 'react-icons/io'
import { PiFileImage } from 'react-icons/pi'
import { type ImageType } from '../..'
import ImageManagerContext from '../../contexts/ImageManagerContext'
import { type GroupType } from '../DisplayGroup'
import { type DisplayStyleType } from '../DisplayStyle'
import ImageCollapse from '../ImageCollapse'
type CollapseTreeProps = {
  dirs: string[]
  imageTypes: string[]
  displayGroup: GroupType[]
  displayStyle: DisplayStyleType
}

type FileNode = {
  label: string
  value: string
  children: FileNode[]
  renderConditions?: Record<string, string>[]
  type?: GroupType
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

  const displayMap = {
    dir: {
      imagePrototype: 'dirPath',
      list: dirs,
      icon: <IoMdFolderOpen />,
    },
    type: {
      imagePrototype: 'fileType',
      list: imageTypes,
      icon: <PiFileImage />,
    },
  } as const

  const checkVaild = (childNode: FileNode, image: ImageType) => {
    return displayGroup.every((g) => {
      return childNode.renderConditions?.some((c) => {
        return c[g] === image[displayMap[g].imagePrototype]
      })
    })
  }

  const nestedDisplay = (tree: FileNode[], collapseProps?: CollapseProps) => {
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
              label={
                <div className={'flex items-center space-x-2'}>
                  <span className={'flex-center'}>{node.type ? displayMap[node.type].icon : <FaRegImages />}</span>
                  <span>{node.label}</span>
                </div>
              }
              images={renderList}
              nestedChildren={nestedDisplay(node.children)}
            ></ImageCollapse>
          )
        })}
      </div>
    )
  }

  const displayByPriority = () => {
    const toBeBuild: BuildRenderOption['toBeBuild'] = {}
    displayGroup.forEach((g) => {
      toBeBuild[g] = displayMap[g].list
    })
    let tree = buildRenderTree({ toBeBuild, flatten: false })
    if (!tree.length) {
      tree = [
        {
          label: t('ia.all'),
          value: 'all',
          children: [],
        },
      ]
    }

    if (displayStyle === 'compact') {
      compactFolders(tree)
    }

    // render tree
    return nestedDisplay(tree, { bordered: true })
  }

  const compactFolders = (tree: FileNode[]) => {
    tree.forEach((node) => {
      const { children } = node
      if (children.length === 1) {
        const child = children[0]
        const renderList = images.visibleList.filter((img) => checkVaild(node, img)) || undefined

        if (!renderList?.length) {
          Object.assign(node, {
            ...child,
            label: `${node.label}/${child.label}`,
          })
          compactFolders(tree)
        } else {
          node.renderList = renderList
          if (child.children.length) {
            compactFolders(child.children)
          }
        }
      } else if (children.length > 1) {
        compactFolders(children)
      }
    })
  }

  return <>{displayByPriority()}</>
}

export default memo(CollapseTree)
