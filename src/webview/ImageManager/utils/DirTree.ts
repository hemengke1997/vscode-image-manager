import { isEmpty, isNumber, mergeWith, uniq } from '@minko-fe/lodash-pro'
import { type ImageType } from '..'
import { type GroupType } from '../components/DisplayGroup'

export type DisplayGroupType = GroupType[]
export type DisplayMapType<T extends Record<string, any> = Record<string, any>> = {
  [key in GroupType | Flatten]: {
    imageKey?: {
      id: string
    }
    list?: Option[]
    priority: number | null
  } & T
}
export type VisibleListType = ImageType[]

export type Flatten = 'all'

export type FileNode = {
  /**
   * 节点名称
   */
  label: string
  /**
   * 节点完整路径名称
   */
  fullLabel: string
  /**
   * 节点标识
   */
  value: string
  /**
   * 节点分组类型（按 workspace | dir | type 分组）
   */
  groupType?: GroupType | Flatten
  /**
   * 当前节点的子节点
   */
  children: FileNode[]
  /**
   * 渲染图片的条件，满足条件的图片会被渲染
   */
  renderCondition: Record<string, string>
  /**
   * 渲染图片列表
   */
  renderList?: ImageType[]
  /**
   * 节点当前目录下的所有图片
   */
  underFolderList?: ImageType[]
}

export type TreeParams = { displayGroup: DisplayGroupType; displayMap: DisplayMapType; visibleList: VisibleListType }

export class DirTree {
  displayGroup: DisplayGroupType
  displayMap: DisplayMapType
  visibleList: VisibleListType

  constructor(params: TreeParams) {
    this.displayGroup = params.displayGroup
    this.displayMap = params.displayMap
    this.visibleList = [...params.visibleList]
  }

  buildRenderTree() {
    const _displayGroup = {} as Record<string, Option[]>

    this.displayGroup.forEach((g) => {
      _displayGroup[g] = this.displayMap[g].list?.filter((t) => !!t.label) || []
    })

    const previousTree = [] as FileNode[][]
    const sortedKeys = this.sortGroup(this.displayGroup)

    sortedKeys.forEach((d, i) => {
      const resultTree = this.arrangeIntoTree(
        _displayGroup[d].map((t) => ({
          ...t,
          path: t.label.split('/'),
        })),
        (n) => {
          n.groupType = d
          if (isEmpty(n.renderCondition)) {
            sortedKeys.forEach((k) => {
              Object.assign({}, n.renderCondition)
              n.renderCondition[k] = k === d ? n.value : ''
            })
          }
          if (i > 0) {
            for (let j = 0; j < i; j++) {
              const tree = this.traverseTreeToSetRenderConditions(previousTree[j], n.renderCondition)
              n.children.push(...tree)
            }
          }
        },
      )
      previousTree.push(resultTree)
    })
    const tree = previousTree[previousTree.length - 1]

    // Maybe we should do this in arrangeIntoTree
    this.renderTree(tree)
    return tree
  }

  renderTree(tree: FileNode[]) {
    const stack = [...tree]
    while (stack.length) {
      const node = stack.pop()
      if (node?.children.length) {
        stack.push(...node.children)
      }

      if (node) {
        const { renderList, underFolderList } = this._filterImages(node)
        node.renderList = renderList
        node.underFolderList = underFolderList
      }
    }
  }

  // 从visibileList中筛选出
  // 1. 符合 renderCondition 条件的图片
  // 2. 当前节点目录下的所有图片
  private _filterImages(node: FileNode) {
    const renderList: ImageType[] = []
    const underFolderList: ImageType[] = []

    this.visibleList.forEach((image) => {
      // 根据渲染条件过滤图片，将符合条件的图片放入 renderList
      if (!isEmpty(node?.renderCondition)) {
        const shouldRender = this.displayGroup.every((g) => {
          const imageValue = this._findImageIdByGroup(image, g)

          const condition = node.renderCondition[g]

          // e.g. condition.dir = '' && image.absDirPath === image.absWorkspace
          // means that the image belongs to the parent node
          if (condition === '' && this._isBelongsToHigherPriority(image, g)) {
            return true
          }

          return condition === imageValue
        })

        if (shouldRender) {
          renderList.push(image)
        }
      }

      // 将当前节点的所有图片放入 underFolderList
      if (node.value === image.absDirPath) {
        underFolderList.push(image)
      }
    })

    return {
      renderList,
      underFolderList,
    }
  }

  private _postFilterd(filterdList: ImageType[]) {
    const filterdSet = new Set(filterdList.map((item) => item.path))
    this.visibleList = this.visibleList.filter((item) => !filterdSet.has(item.path))
  }

  mergeRenderCondition(prev: FileNode['renderCondition'], add: FileNode['renderCondition']) {
    return mergeWith(Object.assign({}, prev), add, (prevValue, addValue) => {
      return addValue || prevValue
    })
  }

  traverseTreeToSetRenderConditions(previousTree: FileNode[], renderCondition: FileNode['renderCondition']) {
    const resultTree: FileNode[] = []
    previousTree.forEach((node) => {
      node = { ...node }
      node.renderCondition = this.mergeRenderCondition(node.renderCondition, renderCondition)
      if (node.children.length) {
        node.children = this.traverseTreeToSetRenderConditions(node.children, renderCondition)
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
            renderCondition: {},
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

  private _isPath(value: string) {
    const PATH_REG = /^(?:[a-zA-Z]:[\\/]|\/)(?:.)+$/
    return PATH_REG.test(value)
  }

  compactFolders(tree: FileNode[]) {
    tree.forEach((node) => {
      const { children } = node
      if (children.length > 1) {
        const pathChildren = children.filter((c) => this._isPath(c.value))

        if (pathChildren.length > 1) {
          this.compactFolders(children)
          return
        }

        const nonPathChildren = children.filter((c) => !this._isPath(c.value))
        const noNonPathRenderList = nonPathChildren.every((child) => {
          const renderList = child.renderList || []
          if (renderList.length) {
            child.renderList = renderList
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
        const child = children.filter((c) => this._isPath(c.value))[0] as FileNode | undefined

        if (child) {
          this.compact(node, tree)
          return
        }
      }
    })
  }

  compact(node: FileNode, tree: FileNode[]) {
    const child = node.children.filter((c) => this._isPath(c.value))[0]
    const renderList = node.renderList || []
    if (!renderList.length) {
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

  private _shouldShowImage(node: FileNode, image: ImageType) {
    return this.displayGroup.every((g) => {
      const imageValue = this._findImageIdByGroup(image, g)

      const condition = node.renderCondition[g]

      // e.g. condition.dir = '' && image.absDirPath === image.absWorkspace
      // means that the image belongs to the parent node
      if (condition === '' && this._isBelongsToHigherPriority(image, g)) {
        return true
      }

      return condition === imageValue
    })
  }

  private _isBelongsToHigherPriority(image: ImageType, currentGroup: GroupType) {
    const imageSomePath = this._findImageIdByGroup(image, currentGroup)

    // only path like fileSystemPath has parent relationship
    if (!this._isPath(imageSomePath)) {
      return false
    }

    const higherPriorityGroup = this.displayGroup.find((g) => {
      return this._findMapByGroup(g).priority === (this._findMapByGroup(currentGroup).priority || -999) - 1
    })

    if (higherPriorityGroup) {
      return imageSomePath === this._findImageIdByGroup(image, higherPriorityGroup)
    }

    return false
  }

  /**
   *
   * @param group 'workspace' | 'dir' | 'type'
   * @returns
   * ```js
   * {
   *  imageKey: {
   *    absolutePath: string,
   *    relativePath: string,
   *  },
   *  priority: number,
   *  list: Option[],
   * }
   * ```
   */
  private _findMapByGroup(group: GroupType) {
    return this.displayMap[group]
  }

  private _findImageIdByGroup = (image: ImageType, g: GroupType): string => {
    const t = this._findMapByGroup(g)
    if (t.imageKey) {
      return image[t.imageKey.id]
    }
    return ''
  }
}
