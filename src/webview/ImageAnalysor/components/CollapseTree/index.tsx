import { omit } from '@minko-fe/lodash-pro'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { FaRegFolderOpen, FaRegImages } from 'react-icons/fa'
import { PiFileImage } from 'react-icons/pi'
import { type DisplayStyleType, type ImageType } from '../..'
import ImageAnalysorContext from '../../contexts/ImageAnalysorContext'
import { shouldShowImage } from '../../utils'
import { type GroupType } from '../DisplayGroup'
import ImageCollapse from '../ImageCollapse'

type CollapseTreeProps = {
  allDirs: string[]
  allImageTypes: string[]
  displayGroup: GroupType[]
  displayStyle: DisplayStyleType
}

type FileNode = {
  label: string
  value: string
  children: FileNode[]
  renderConditions?: Record<string, string>[]
  parent?: Omit<FileNode, 'children' | 'parent'>
  type?: GroupType
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
  const resultMap: Record<string, FileNode> = {}

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
    list.forEach((item) => {
      const itemArr = item.split('/')
      let parent = resultTree
      itemArr.forEach((name, index) => {
        if (!resultMap[name]) {
          resultMap[name] = {
            label: name,
            value: item,
            children: [],
          }
          if (index !== 0) {
            resultMap[name].parent = omit(resultMap[itemArr[index - 1]], 'children', 'parent')
          }
          onGenerate?.(resultMap[name])

          parent.push(resultMap[name])
        }
        parent = resultMap[name].children
      })
    })
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
  const { allDirs, allImageTypes, displayGroup, displayStyle } = props
  const { images } = ImageAnalysorContext.usePicker(['images'])
  const { t } = useTranslation()

  const displayMap = {
    dir: {
      imagePrototype: 'dirPath',
      list: allDirs,
      icon: <FaRegFolderOpen />,
    },
    type: {
      imagePrototype: 'fileType',
      list: allImageTypes,
      icon: <PiFileImage />,
    },
  } as const

  const checkVaild = (childNode: FileNode, image: ImageType) => {
    // TODO: 统一处理visible
    if (!shouldShowImage(image)) {
      return false
    }

    return displayGroup.every((g) => {
      return childNode.renderConditions?.some((c) => {
        return c[g] === image[displayMap[g].imagePrototype]
      })
    })
  }

  const nestedDisplay = (tree: FileNode[]) => {
    if (!tree.length) return null

    return (
      <div className={'space-y-2'}>
        {tree.map((node) => {
          const isLast = !node.children.length && Object.keys(node.renderConditions || []).length > 1
          const renderList = images.list.filter((img) => checkVaild(node, img)) || []

          return (
            <ImageCollapse
              key={node.value}
              id={node.value}
              collapseProps={{
                bordered: !isLast,
                collapsible: 'icon',
              }}
              label={
                <div className={'flex items-center space-x-2'}>
                  <span className={'flex-center'}>{node.type ? displayMap[node.type].icon : <FaRegImages />}</span>{' '}
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
    let tree = buildRenderTree({ toBeBuild, flatten: displayStyle === 'flat' })
    if (!tree.length) {
      tree = [
        {
          label: t('ns.all'),
          value: 'all',
          children: [],
        },
      ]
    }

    // render tree
    return nestedDisplay(tree)
  }

  return <>{displayByPriority()}</>
}

export default memo(CollapseTree)
