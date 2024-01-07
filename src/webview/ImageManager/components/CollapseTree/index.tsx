import { isNumber, uniq } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { type CollapseProps } from 'antd'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FaRegImages } from 'react-icons/fa'
import { FaRegObjectGroup } from 'react-icons/fa6'
import { IoMdFolderOpen } from 'react-icons/io'
import { PiFileImage } from 'react-icons/pi'
import { type ImageType } from '../..'
import TreeContext from '../../contexts/TreeContext'
import { type GroupType } from '../DisplayGroup'
import { type DisplayStyleType } from '../DisplayStyle'
import ImageCollapse from '../ImageCollapse'
import OpenFolder from './components/OpenFolder'

type GroupOption = Option

type CollapseTreeProps = {
  workspaceFolders: GroupOption[]
  dirs: GroupOption[]
  imageTypes: GroupOption[]
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
  list: Option[],
  options: {
    onGenerate?: (node: FileNode) => void
  },
) {
  const { onGenerate } = options
  const resultTree: FileNode[] = []

  for (const file of list) {
    const paths = file.label.split('/')
    let currentNodes = resultTree
    paths.forEach((path) => {
      const find = currentNodes.find((item) => item.label === path)
      if (find) {
        currentNodes = find.children
      } else {
        const node = {
          label: path,
          value: file.value,
          children: [],
        }
        onGenerate?.(node)
        currentNodes.push(node)
        currentNodes = node.children
      }
    })
  }

  return resultTree
}

type BuildRenderOption = {
  toBeBuild: Record<string, Option[]>
}

function traverseTreeToSetRenderConditions(previousTree: FileNode[], renderConditions: Record<string, string>[]) {
  const resultTree: FileNode[] = []
  previousTree.forEach((node) => {
    node = { ...node }
    if (node.children.length) {
      node.children = traverseTreeToSetRenderConditions(node.children, renderConditions)
    } else {
      node.renderConditions = [...(node.renderConditions || []), ...renderConditions]
    }
    resultTree.push(node)
  })
  return resultTree
}

function buildRenderTree(options: BuildRenderOption) {
  const { toBeBuild } = options
  let previousTree = [] as FileNode[]
  Object.keys(toBeBuild).forEach((d) => {
    previousTree = treeify(toBeBuild[d], {
      onGenerate: (n) => {
        n.type = d as GroupType

        if (!n.renderConditions) {
          n.renderConditions = [{ [d]: n.value }]
        }

        const p = traverseTreeToSetRenderConditions(previousTree, n.renderConditions)

        n.children.push(...p)
      },
    })
  })
  return previousTree
}

function CollapseTree(props: CollapseTreeProps) {
  const { workspaceFolders, dirs, imageTypes, displayGroup, displayStyle } = props
  const { imageSingleTree } = TreeContext.usePicker(['imageSingleTree'])
  const { t } = useTranslation()

  const displayMap = useMemo(
    () => ({
      workspace: {
        imagePrototype: 'absWorkspaceFolder',
        list: workspaceFolders,
        icon: (props: { path: string }) => (
          <OpenFolder {...props}>
            <FaRegObjectGroup />
          </OpenFolder>
        ),
        contextMenu: true,
        priority: 1,
      },
      dir: {
        imagePrototype: 'absDirPath',
        list: dirs,
        icon: (props: { path: string }) => (
          <OpenFolder {...props}>
            <IoMdFolderOpen />
          </OpenFolder>
        ),
        contextMenu: true,
        priority: 2,
      },
      type: {
        imagePrototype: 'fileType',
        list: imageTypes,
        icon: () => <PiFileImage />,
        contextMenu: false,
        priority: 3,
      },
      all: {
        icon: (props: { path: string }) => (
          <OpenFolder {...props}>
            <FaRegImages />
          </OpenFolder>
        ),
        contextMenu: true,
        priority: null,
      },
    }),
    [workspaceFolders, dirs, imageTypes],
  )

  const sortGroup = useMemoizedFn((group: GroupType[] | undefined) => {
    const allGroupType = Object.keys(displayMap).filter((k) => displayMap[k].priority)
    group = uniq(group?.filter((item) => allGroupType.includes(item)))
    if (group.length > 1) {
      const findPriority = (v: GroupType) => {
        return displayMap[allGroupType.find((item) => item === v) || ''].priority || 0
      }
      group = group.sort((a, b) => {
        return findPriority(b) - findPriority(a)
      })
    }
    return group
  })

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
          const renderList = node.renderList || imageSingleTree.visibleList.filter((img) => checkVaild(node, img)) || []

          return (
            <ImageCollapse
              key={node.value}
              id={node.value}
              collapseProps={{
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
              joinLabel={!!displayMap[node.type!].priority}
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
    sortGroup(displayGroup).forEach((g) => {
      toBeBuild[g] = displayMap[g].list
    })

    let tree = buildRenderTree({ toBeBuild })
    if (!tree.length) {
      tree = [
        {
          label: t('ia.all'),
          type: 'all',
          value: workspaceFolders[0].value,
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
        const renderList = imageSingleTree.visibleList.filter((img) => checkVaild(node, img)) || undefined

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
