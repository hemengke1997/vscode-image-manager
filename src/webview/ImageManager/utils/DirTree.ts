import { isNumber, uniq } from '@minko-fe/lodash-pro'
import { type ImageType } from '..'
import { type GroupType } from '../components/DisplayGroup'

type DisplayGroupType = GroupType[]
type DisplayMapType = {
  [key in GroupType]: {
    imageKeys: {
      absolutePath: string
      relativePath: string
    }
  }
}
type VisibleList = ImageType[]

type Flatten = 'all'

export type FileNode = {
  label: string
  fullLabel: string
  value: string
  children: FileNode[]
  renderConditions?: Record<string, string>[]
  type?: GroupType | Flatten
  // for compactFolders
  renderList?: ImageType[]
}

export type BuildRenderOption = {
  toBeBuild: Record<string, Option[]>
}

export class DirTree {
  displayGroup: DisplayGroupType
  displayMap: DisplayMapType
  visibleList: VisibleList

  constructor(params: { displayGroup: DisplayGroupType; displayMap: DisplayMapType; visibleList: VisibleList }) {
    this.displayGroup = params.displayGroup
    this.displayMap = params.displayMap
    this.visibleList = params.visibleList
  }

  buildRenderTree(options: BuildRenderOption) {
    const { toBeBuild } = options
    const previousTree = [] as FileNode[][]
    const sortedKeys = this.sortGroup(this.displayGroup)

    sortedKeys.forEach((d, i) => {
      const resultTree = this.arrangeIntoTree(
        toBeBuild[d].map((t) => ({
          ...t,
          path: t.label.split('/'),
        })),
        (n) => {
          n.type = d
          if (!n.renderConditions) {
            n.renderConditions = sortedKeys.map((k) => ({ [k]: k === d ? n.value : '' }))
          }
          if (i > 0) {
            for (let j = 0; j < i; j++) {
              const tree = this.traverseTreeToSetRenderConditions(previousTree[j], n.renderConditions)
              n.children.push(...tree)
            }
          }
        },
      )
      previousTree.push(resultTree)
    })

    return previousTree[previousTree.length - 1]
  }

  traverseTreeToSetRenderConditions(previousTree: FileNode[], renderConditions: Record<string, string>[]) {
    const resultTree: FileNode[] = []
    previousTree.forEach((node) => {
      node = { ...node }
      if (node.children.length) {
        node.children = this.traverseTreeToSetRenderConditions(node.children, renderConditions)
      } else {
        function pushRenderCondition(prev: FileNode['renderConditions'], add: FileNode['renderConditions']) {
          const result = [...(prev || [])]
          add?.forEach((a) => {
            const k = Object.keys(a)[0]
            const index = result.findIndex((p) => Object.keys(p)[0] === k)
            if (index !== -1) {
              if (a[k]) {
                result.splice(index, 1)
                result.push(a)
              }
            } else {
              result.push(a)
            }
          })
          return result
        }
        node.renderConditions = [...(pushRenderCondition(node.renderConditions, renderConditions) || [])]
      }
      resultTree.push(node)
    })
    return resultTree
  }

  arrangeIntoTree(options: { path: string[]; label: string; value: string }[], onGenerate?: (node: FileNode) => void) {
    const tree = [] as FileNode[]
    for (let i = 0; i < options.length; i++) {
      const { path, label, value } = options[i]
      let currentLevel = tree
      for (let j = 0; j < path.length; j++) {
        const part = path[j]

        const existingPath = this.findWhere(currentLevel, 'label', part)

        if (existingPath) {
          currentLevel = existingPath.children
        } else {
          const basePath = value.slice(0, value.lastIndexOf(label))
          const fullLabel = path.slice(0, j + 1).join('/')
          const newPart: FileNode = {
            label: part,
            fullLabel,
            value: basePath + fullLabel,
            children: [],
          }
          onGenerate?.(newPart)
          currentLevel.push(newPart)
          currentLevel = newPart.children
        }
      }
    }
    return tree
  }

  findWhere(array: FileNode[], key: string, value: string) {
    let t = 0
    while (t < array.length && array[t][key] !== value) {
      t++
    }
    if (t < array.length) {
      return array[t]
    } else {
      return false
    }
  }

  sortGroup(group: GroupType[] | undefined) {
    const allGroupType = Object.keys(this.displayMap).filter((k) => this.displayMap[k].priority)
    group = uniq(group?.filter((item) => allGroupType.includes(item)))
    if (group.length > 1) {
      const findPriority = (v: GroupType) => {
        return this.displayMap[allGroupType.find((item) => item === v) || ''].priority || 0
      }
      group = group.sort((a, b) => {
        return findPriority(b) - findPriority(a)
      })
    }
    return group
  }

  isPath(value: string) {
    return value.startsWith('/')
  }

  compactFolders(tree: FileNode[]) {
    tree.forEach((node) => {
      const { children } = node
      if (children.length > 1) {
        const pathChildren = children.filter((c) => this.isPath(c.value))

        if (pathChildren.length > 1) {
          this.compactFolders(children)
          return
        }

        const nonPathChildren = children.filter((c) => !this.isPath(c.value))
        const noNonPathRenderList = nonPathChildren.every((child) => {
          const renderLinst = this.visibleList.filter((img) => this.shouldShowImage(child, img)) || []
          if (renderLinst.length) {
            child.renderList = renderLinst
            return false
          }
          return true
        })

        if (!noNonPathRenderList) {
          this.compactFolders(pathChildren)
          return
        }

        const child = pathChildren[0]
        if (child) {
          this.compact(node, tree)
          return
        }
      } else if (isNumber(children.length)) {
        const child = children.filter((c) => this.isPath(c.value))[0] as FileNode | undefined

        if (child) {
          this.compact(node, tree)
          return
        }
      }
    })
  }

  compact(node: FileNode, tree: FileNode[]) {
    const child = node.children.filter((c) => this.isPath(c.value))[0]
    const renderList = this.visibleList.filter((img) => this.shouldShowImage(node, img)) || []
    if (!renderList?.length) {
      Object.assign(node, {
        ...child,
        label: `${node.label}/${child.label}`,
      })
      if (child.children.length) {
        this.compactFolders(tree)
      }
    } else {
      node.renderList = renderList
      if (node.children.length) {
        this.compactFolders(node.children)
      }
    }
  }

  shouldShowImage(node: FileNode, image: ImageType) {
    return this.displayGroup.every((g) => {
      const imageValue = image[this.displayMap[g].imageKeys.absolutePath]
      return node.renderConditions?.some((condition) => {
        // e.g. condition.dir = '' && image.dirPath = ''
        // means that the image belongs to the parent node
        if (condition[g] === '' && image[this.displayMap[g].imageKeys.relativePath] === '') {
          return true
        }
        return condition[g] === imageValue
      })
    })
  }
}
