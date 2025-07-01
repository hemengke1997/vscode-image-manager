import type { PartialDeep } from 'type-fest'
import type { ImageFilterType } from '../../hooks/use-image-filter/image-filter'
import type { NodeID, TreeNode } from './tree'
import type { SortType } from '~/core/persist/workspace/common'
import { uniqBy } from 'es-toolkit'
import { defaults, isObject } from 'es-toolkit/compat'
import { produce } from 'immer'
import { DEFAULT_WORKSPACE_STATE, DisplayStyleType, SortByType } from '~/core/persist/workspace/common'
import { Compressed } from '~/meta'
import logger from '~/utils/logger'
import { bytesToUnit } from '..'
import { FilterRadioValue, ImageVisibleFilter } from '../../hooks/use-image-filter/const'
import { UpdateEvent, UpdateOrigin } from './const'
import { NodeType, Tree, TreeStyle } from './tree'
import { formatPath } from './utils'

export type UpdatePayload
  = | {
    origin: UpdateOrigin.image
    data: ImageUpdateType
  }
  | {
    origin: UpdateOrigin.dir
    data: DirUpdateType
  }

export type ImageUpdateType
  = | {
    type: UpdateEvent.create
    payload: ImageType
  }
  | {
    type: UpdateEvent.delete
    payload: ImageType
  }
  | {
    type: UpdateEvent.update
    payload: ImageType
  }

export type DirUpdateType = {
  type: UpdateEvent.create | UpdateEvent.delete | UpdateEvent.update
  payload: {
    dirPath: string
    absDirPath: string
    workspaceFolder: string
  }
}

type Options = {
  /**
   * 目录风格
   */
  treeStyle: TreeStyle
  /**
   * 是否开启紧凑模式
   */
  compact: boolean
  /**
   * 排序方式
   */
  sort: [SortByType, SortType]
  /**
   * 过滤方式
   */
  filter: ImageFilterType
}

export type NestedTreeNode = {
  children?: NestedTreeNode[]
} & TreeNode<TreeData>

export type TreeData = {
  images: ImageType[] | undefined
  // 树风格，按xx分组
  treeStyle: TreeStyle
  // 节点类型，目录节点、extension节点、根节点
  nodeType: NodeType
  // 目录路径
  path?: string
  // 紧凑。compact节点的子节点需要合并到父节点
  compact?: {
    // 子节点是否已经合并
    ed?: boolean
    // 是否是紧凑节点
    is?: boolean
    // compact节点合并之前的路径
    // 当ed设置true时，也同时需要设置Path
    originalPath?: string
  }
  /**
   * 节点是否改变
   */
  changed?: {
    // 节点的images是否改变
    images?: boolean
  }
}

export class TreeManager {
  tree: Tree<TreeData>

  private sortFunctions: {
    [key in SortByType]: {
      [key in SortType]: (a: ImageType, b: ImageType) => number
    }
  } = {
    [SortByType.size]: {
      asc: (a: ImageType, b: ImageType) => a.stats.size - b.stats.size,
      desc: (a: ImageType, b: ImageType) => b.stats.size - a.stats.size,
    },
    [SortByType.basename]: {
      asc: (a: ImageType, b: ImageType) => a.basename.localeCompare(b.basename),
      desc: (a: ImageType, b: ImageType) => b.basename.localeCompare(a.basename),
    },
    [SortByType.mtime]: {
      asc: (a: ImageType, b: ImageType) => a.stats.mtimeMs - b.stats.mtimeMs,
      desc: (a: ImageType, b: ImageType) => b.stats.mtimeMs - a.stats.mtimeMs,
    },
  }

  private options: Options

  constructor(
    private rootId: string,
    options: PartialDeep<Options> & Required<Pick<Options, 'treeStyle'>>,
  ) {
    this.tree = new Tree<TreeData>(this.rootId)

    this.options = {
      sort: DEFAULT_WORKSPACE_STATE.display_sort,
      compact: DEFAULT_WORKSPACE_STATE.display_style === DisplayStyleType.compact,
      ...options,
      filter: defaults(options?.filter || {}, DEFAULT_WORKSPACE_STATE.image_filter),
    }
  }

  /**
   * 根据筛选条件过滤图片
   */
  private processImages(images: ImageType[]) {
    images = this.sortImages(this.options.sort, this.filterImages(images))

    return images
  }

  /**
   * 把图片生成树形结构
   *
   * 依赖：[images, treeStyle, sort, filter, compact]
   */
  generateTree(images: ImageType[]) {
    logger.time('processImages')
    images = this.processImages(images)
    logger.timeEnd('processImages')

    logger.time('generateTree')
    this.tree = new Tree<TreeData>(this.rootId)

    images.forEach((image) => {
      const { id, parentId, nodeType } = this.genId(image)
      this.tree.addNode(id, {
        data: {
          images: [image],
          path: '',
          treeStyle: this.options.treeStyle,
          nodeType,
        },
        parentId,
      })
    })
    logger.timeEnd('generateTree')

    this.compactFolders()

    return this
  }

  /**
   * tree map 转成 tree array
   * 方便react渲染
   */
  async toNestedArray(_hooks?: { postNode?: (node: TreeNode<TreeData>) => TreeNode<TreeData> }): Promise<NestedTreeNode[]> {
    logger.time('toNestedArray')
    const result: NestedTreeNode[] = []

    const buildNestedTree = async (nodeId: NodeID): Promise<NestedTreeNode> => {
      const node = this.tree.nodes.get(nodeId)!

      if (node.data.compact?.is) {
        return this.compactChildren(node, async (childNode) => {
          return await buildNestedTree(childNode.id)
        })
      }

      node.data.changed ||= {}
      let images: ImageType[] = node.data.images || []
      if (node.data.changed.images) {
        images = this.processImages(node.data.images || [])
        node.data = produce(node.data, (draft) => {
          draft.changed!.images = false
        })
      }

      const children = await Promise.all(node.childrenIds.map(childId => buildNestedTree(childId)))
      return produce(node as NestedTreeNode, (draft) => {
        draft.data.images = images
        draft.children = children
      })
    }

    if (this.tree.nodes.size) {
      logger.debug(this.tree, 'this.tree')
      result.push(await buildNestedTree(this.rootId))
    }
    logger.timeEnd('toNestedArray')
    return result
  }

  /**
   * 把 nestedArray 转成 array
   * 方便收集数据
   */
  toArray<T>(nested: NestedTreeNode[], filter: (node: TreeNode<TreeData>) => T): T[] {
    logger.time('toArray')
    const result: T[] = []

    const traverse = (node: NestedTreeNode) => {
      const { children, ...rest } = node
      result.push(filter(rest))

      children?.forEach((child) => {
        traverse(child)
      })
    }

    nested.forEach((node) => {
      traverse(node)
    })

    logger.timeEnd('toArray')
    return result
  }

  /**
   * 增量更新
   */
  updateTree(message: UpdatePayload[]) {
    message.forEach((msg) => {
      const { data, origin } = msg
      switch (origin) {
        case UpdateOrigin.image: {
          this.imageUpdate(data)
          break
        }
        case UpdateOrigin.dir: {
          this.dirUpdate(data)
          break
        }
      }
    })

    this.compactFolders()

    return this
  }

  /**
   * 图片增量更新
   */
  private imageUpdate(data: ImageUpdateType) {
    const { type, payload: image } = data
    const { id, nodeType } = this.genId(image)

    switch (type) {
      case UpdateEvent.create: {
        this.tree.addNode(id, {
          data: {
            images: [image],
            treeStyle: this.options.treeStyle,
            nodeType,
            changed: {
              images: true,
            },
          },
        })
        break
      }

      case UpdateEvent.update: {
        this.tree.updateNode(id, {
          data: (data) => {
            const images = data.images?.map((img) => {
              if (img.path === image.path) {
                return image
              }
              return img
            })

            return produce(data, (draft) => {
              draft.images = images
              draft.changed ||= {}
              draft.changed.images = true
            })
          },
        })
        break
      }

      case UpdateEvent.delete: {
        this.tree.updateNode(id, {
          data: (data) => {
            const images = data.images?.filter(img => img.path !== image.path)
            return produce(data, (draft) => {
              draft.images = images
              draft.changed ||= {}
              draft.changed.images = true
            })
          },
        })

        this.deleteEmptyNodes(this.tree.parseParentId(id))
        break
      }

      default:
        break
    }
  }

  /**
   * 目录增量更新
   */
  private dirUpdate(data: DirUpdateType) {
    const { type, payload } = data

    const id = formatPath(`${this.rootId}/${payload.dirPath}`)

    switch (type) {
      case UpdateEvent.create: {
        break
      }
      case UpdateEvent.delete: {
        this.tree.deleteNode(id)

        // 如果删除节点后，父节点是空节点，也删除
        this.deleteEmptyNodes(this.tree.parseParentId(id))
        break
      }
      default:
        break
    }
  }

  /**
   * 把紧凑节点与子节点合并
   */
  private compactChildren<T>(node: TreeNode<TreeData>, callback: (childNode: TreeNode<TreeData>) => T): T {
    const childId = node.childrenIds[0]
    const childNode = this.tree.getNode(childId)!

    childNode.data.compact ||= {}

    if (!childNode.data.compact.ed) {
      // 留根，保存原路径
      childNode.data.compact.originalPath = childNode.data.path

      childNode.data.path = formatPath(`${node.data.path}/${childNode.data.path}`)
    }

    childNode.data.compact.ed = true

    return callback(childNode)
  }

  /**
   * 打印目录tree
   */
  async printTree() {
    const nestedArray = await this.toNestedArray()

    const indent = (level: number) => '  '.repeat(level) // 缩进函数
    let result = ''

    const traverse = (nodes: NestedTreeNode[], level: number) => {
      nodes.forEach((node) => {
        if (!node.children?.length && !node.data.images?.length)
          return

        // 打印当前节点路径
        result += `${indent(level)}|-- ${node.data.path}\n`

        // 打印当前节点的图片
        node.data.images?.forEach((image) => {
          result += `${indent(level + 1)}|-- ${image.basename}\n`
        })

        // 递归处理子节点
        if (node.children) {
          traverse(node.children, level + 1)
        }
      })
    }

    traverse(nestedArray, 0)
    return result
  }

  /**
   * 获取节点的图片（如果是紧凑节点，则获取子节点的图片）
   */
  getNodeImages(nodeId: NodeID): ImageType[] | undefined {
    const node = this.tree.getNode(nodeId)
    if (!node)
      return

    // 如果节点是紧凑节点，则获取子节点的图片
    if (node.data.compact?.is) {
      const childId = node.childrenIds[0]
      return this.getNodeImages(childId)
    }

    return node.data.images || []
  }

  /**
   * 获取节点以及节点下所有节点的图片
   */
  getSubnodeImages(nodeId: NodeID): ImageType[] | undefined {
    // 从当前节点开始向下递归获取所有子节点的图片
    const traverse = (id: NodeID): ImageType[] => {
      const node = this.tree.getNode(id)
      if (!node)
        return []

      // 如果节点是紧凑节点，则获取子节点的图片
      if (node.data.compact?.is) {
        const childId = node.childrenIds[0]
        return traverse(childId)
      }

      const images = node.data.images || []
      const childrenImages = node.childrenIds.flatMap(childId => traverse(childId))

      return uniqBy([...images, ...childrenImages], item => item.path)
    }
    return traverse(nodeId)
  }

  /**
   * 根据目录风格生成节点构建信息
   */
  private genId(image: ImageType) {
    switch (this.options.treeStyle) {
      case TreeStyle.dir: {
        return {
          id: formatPath(`${this.tree.rootId}/${image.dirPath}`),
          parentId: null,
          nodeType: NodeType.dir,
        }
      }
      case TreeStyle.extension: {
        return {
          id: formatPath(`${this.tree.rootId}/${image.extname}`),
          parentId: null,
          nodeType: NodeType.ext,
        }
      }
      case TreeStyle.dir_extension: {
        return {
          id: formatPath(`${this.tree.rootId}/${image.dirPath}/${image.extname}`),
          parentId: formatPath(`${this.tree.rootId}/${image.dirPath}`),
          nodeType: NodeType.ext,
        }
      }
      case TreeStyle.flat: {
        return {
          id: this.tree.rootId,
          parentId: null,
          nodeType: NodeType.root,
        }
      }
      default:
        return {
          id: this.tree.rootId,
          parentId: null,
          nodeType: NodeType.root,
        }
    }
  }

  /**
   * 向上递归删除空节点
   */
  private deleteEmptyNodes(nodeId: NodeID) {
    logger.time('deleteEmptyNodes')

    const traverseDeleteEmptyDir = (id: NodeID) => {
      const node = this.tree.getNode(id)
      if (!node)
        return

      // 如果节点没有子节点，且没有图片，则视为空节点，可以删除
      if (!node.childrenIds.length && !node.data.images?.length) {
        this.tree.deleteNode(id)

        traverseDeleteEmptyDir(node.parentId!)
      }
    }
    traverseDeleteEmptyDir(nodeId)

    logger.timeEnd('deleteEmptyNodes')
  }

  /**
   * 判断节点是否为紧凑节点
   */
  private isCompactNode(nodeId: NodeID) {
    const node = this.tree.getNode(nodeId)
    if (!node)
      return false

    if (nodeId === this.tree.rootId) {
      return false
    }
    let isCompact = false
    // 如果子节点没有兄弟节点，且节点中没有图片，则把节点视为紧凑节点
    isCompact = node.childrenIds.length === 1 && !node.data.images?.length

    if (isCompact) {
      // 特殊处理，如果节点的子节点中有extension节点，则节点不视为紧凑
      if (
        this.tree
          .getChildren(node.id)
          .some(t => [TreeStyle.extension, TreeStyle.dir_extension].includes(t.data.treeStyle))
      ) {
        isCompact = false
      }
    }
    return isCompact
  }

  /**
   * 遍历树，更新compact属性
   */
  private compactFolders() {
    if (this.options?.compact) {
      logger.time('compactFolders')

      this.tree.traverseDFS((node) => {
        const isCompact = this.isCompactNode(node.id)

        this.tree.updateNode(node.id, {
          data: (data) => {
            return produce(data, (draft) => {
              // 恢复compact节点的路径
              draft.path = draft.compact?.originalPath || draft.path

              // 初始化compact
              draft.compact = {
                is: isCompact,
              }
            })
          },
        })
      })

      logger.timeEnd('compactFolders')
    }
  }

  /**
   * 节点中图片排序
   */
  private sortImages(sort: [SortByType, SortType], images: ImageType[]) {
    const [sortType, sortOrder] = sort!
    const sortFunction = this.sortFunctions[sortType][sortOrder]
    return images.sort(sortFunction)
  }

  /**
   * 根据visible过滤图片
   */
  private filterImages(images: ImageType[]) {
    return images.filter((image) => {
      const visible = this.isImageVisible(
        image,
        Object.keys(ImageVisibleFilter) as ImageVisibleFilter[],
        this.options.filter,
      )

      if (isObject(visible) && Object.keys(visible).some(k => visible?.[k] === false)) {
        return false
      }
      return true
    })
  }

  private isImageVisible(image: ImageType, key: ImageVisibleFilter[], imageFilter: ImageFilterType) {
    type Condition = {
      /**
       * visible的key
       */
      key: ImageVisibleFilter
      /**
       * 判断是否显示图片
       * @returns should show or not
       */
      condition: (image: ImageType) => boolean | undefined
    }

    const builtInConditions: Condition[] = [
      {
        key: ImageVisibleFilter.exclude_types,
        condition: image => (!imageFilter.exclude_types.includes(image.extname)),
      },
      {
        key: ImageVisibleFilter.size,
        condition: (image) => {
          return (
            bytesToUnit(image.stats.size, imageFilter.size.unit) >= (imageFilter.size?.min || 0)
            && bytesToUnit(image.stats.size, imageFilter.size.unit) <= (imageFilter.size?.max || Number.POSITIVE_INFINITY)
          )
        },
      },
      {
        key: ImageVisibleFilter.git_staged,
        condition: (image) => {
          if (imageFilter.git_staged) {
            switch (imageFilter.git_staged) {
              case FilterRadioValue.yes:
                return image.info.gitStaged
              case FilterRadioValue.no:
                return !image.info.gitStaged
              default:
                return true
            }
          }
          return true
        },
      },
      {
        key: ImageVisibleFilter.compressed,
        condition: (image) => {
          if (imageFilter.compressed) {
            const compressed = image.info.compressed
            switch (imageFilter.compressed) {
              case FilterRadioValue.yes:
                return compressed === Compressed.yes
              case FilterRadioValue.no:
                return compressed === Compressed.no
              case FilterRadioValue.unknown:
                return compressed === Compressed.unknown
              default:
                return true
            }
          }
          return true
        },
      },
    ]

    const conditions = key.map(k => builtInConditions.find(c => c.key === k) as Condition)

    image.visible ||= {}

    conditions.forEach(({ key, condition }) => {
      image.visible![key] = condition(image)
    })

    return image.visible
  }
}
