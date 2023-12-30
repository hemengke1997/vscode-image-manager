import { memo } from 'react'
import { type ImageType } from '../..'
import ImageAnalysorContext from '../../contexts/ImageAnalysorContext'
import { type GroupType } from '../DisplayGroup'
import ImageCollapse from '../ImageCollapse'

export type ChildNodeType = {
  path: string
  fullpath: string[]
  group: GroupType | null
  fullGroup: GroupType[]
  children: ChildNodeType[]
  nodes?: ImageType[]
}

type CollapseTreeProps = {
  allDirs: string[]
  allImageTypes: string[]
  displayGroup: GroupType[]
}

function CollapseTree(props: CollapseTreeProps) {
  const { allDirs, allImageTypes, displayGroup } = props
  const { images } = ImageAnalysorContext.usePicker(['images'])
  const displayMap = {
    dir: {
      imagePrototype: 'dirPath',
      list: allDirs,
    },
    type: {
      imagePrototype: 'fileType',
      list: allImageTypes,
    },
  } as const

  const checkVaild = (fullpath: string[], fullGroup: GroupType[], image: ImageType) => {
    if (fullpath.length !== fullGroup.length) {
      return false
    }
    if (fullGroup.length === 0) {
      // flatten, always true
      return true
    }
    return fullGroup.every((g, index) => {
      if (image[displayMap[g].imagePrototype] !== fullpath[index]) {
        return false
      }
      return true
    })
  }

  const nestedDisplay = (children: ChildNodeType[], tree: ChildNodeType[]) => {
    if (!children.length) return null
    return (
      <div className={'space-y-2'}>
        {children.map((child, index) => {
          const isLast = !child.children.length

          return (
            <ImageCollapse
              key={index}
              collapseProps={{
                bordered: !isLast,
                collapsible: 'icon',
                size: 'small',
              }}
              group={{
                label: child.path,
                children: images.list.filter((img) => checkVaild(child.fullpath, child.fullGroup, img)) || [],
              }}
              nestedChildren={nestedDisplay(child.children, tree)}
            ></ImageCollapse>
          )
        })}
      </div>
    )
  }

  const buildRenderTree = (
    sortedGroup: GroupType[],
    parent?: {
      fullpath: string[]
      fullGroup: GroupType[]
    },
  ): ChildNodeType[] => {
    if (!sortedGroup.length) {
      return []
    } else {
      const [group, ...rest] = sortedGroup
      const list = displayMap[group].list

      const { fullpath = [], fullGroup = [] } = parent || {}

      if (list) {
        return list.map((path) => {
          return {
            path,
            fullpath: [...fullpath, path],
            group,
            fullGroup: [...fullGroup, group],
            children: buildRenderTree(rest, {
              fullpath: [...fullpath, path],
              fullGroup: [...fullGroup, group],
            }),
          }
        })
      }
      return []
    }
  }

  const displayByPriority = () => {
    let tree = buildRenderTree(displayGroup)
    if (!tree.length) {
      tree = [
        {
          fullGroup: [],
          fullpath: [],
          path: 'flatten',
          group: null,
          children: [],
        },
      ]
    }
    // render tree
    return nestedDisplay(tree, tree)
  }

  return <>{displayByPriority()}</>
}

export default memo(CollapseTree)
