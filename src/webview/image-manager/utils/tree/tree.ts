import { isNil, last, mergeWith, uniq } from 'es-toolkit'

export type NodeID = string

export interface TreeNode<T extends Record<string, any>> {
  // 节点ID，使用节点路径作为ID
  id: NodeID
  // 父节点ID
  parentId: NodeID | null
  // 子节点ID
  childrenIds: NodeID[]
  data: T
}

// 生成目录树的风格
// flat: 平铺展示
// dir: 按目录分组
// extension: 按图片类型分组
// dir_extension: 按目录和图片类型分组
export enum TreeStyle {
  flat = 'flat',
  dir = 'dir',
  extension = 'extension',
  dir_extension = 'dir_extension',
}

export enum NodeType {
  root = 'root',
  dir = 'dir',
  ext = 'ext',
}

export class Tree<T extends Record<string, any>> {
  constructor(public rootId: NodeID) {}

  /**
   * 核心数据结构
   */
  public nodes: Map<NodeID, TreeNode<T>> = new Map()

  private isValidId(id: unknown): id is NodeID {
    return !isNil(id)
  }

  /**
   * 根据ID解析父节点ID
   */
  parseParentId(id: NodeID): NodeID {
    return id.split('/').slice(0, -1).join('/')
  }

  /**
   * 格式化ID
   */
  formatId<T = NodeID | null | undefined>(id: T): T {
    if (!id) return id
    return (id as any).replace(/\/+/g, '/').replace(/\/$/, '')
  }

  /**
   * 添加节点，可指定父节点
   */
  addNode(
    id: NodeID,
    options: {
      data: T
      parentId?: NodeID | null
      childrenId?: NodeID | null
    },
  ) {
    let { data, childrenId, parentId } = options

    id = this.formatId(id)
    parentId = this.formatId(parentId)
    childrenId = this.formatId(childrenId)

    if (this.nodes.has(id)) {
      this.updateNode(id, {
        ...options,
        data: (data) =>
          mergeWith(data, options.data, (objValue, srcValue) => {
            if (Array.isArray(objValue)) {
              return objValue.concat(srcValue)
            }
            return srcValue || objValue
          }),
      }) // 如果节点已存在，则更新数据
      return
    }

    const newNode: TreeNode<T> = {
      id,
      data: {
        ...data,
        path: last(id.split('/').filter(Boolean)),
      },
      parentId: parentId || this.parseParentId(id),
      childrenIds: childrenId ? [childrenId] : [],
    }

    // 更新父节点引用
    if (this.isValidId(parentId)) {
      const parentNode = this.nodes.get(parentId)
      if (!parentNode) {
        this.addNode(parentId, {
          data: {} as T,
          parentId: null,
          childrenId: id,
        })
      } else {
        this.updateNode(parentId, {
          childrenId: id,
        })
      }
    } else if (id !== this.rootId) {
      // 递归添加父节点
      const parentId = this.parseParentId(newNode.id)
      this.addNode(parentId, {
        data: {} as T,
        parentId: null,
        childrenId: id,
      })
    }

    this.nodes.set(id, newNode)
  }

  /**
   * 删除节点及其所有子节点
   */
  deleteNode(id: NodeID): void {
    const node = this.nodes.get(id)
    if (!node) return

    // 递归删除所有子节点
    const deleteRecursive = (currentId: NodeID) => {
      const current = this.nodes.get(currentId)!
      current.childrenIds.forEach(deleteRecursive)
      this.nodes.delete(currentId)
    }
    deleteRecursive(id)

    // 更新父节点引用
    if (this.isValidId(node.parentId)) {
      const parent = this.nodes.get(node.parentId)!
      const index = parent.childrenIds.indexOf(id)
      if (index > -1) {
        parent.childrenIds.splice(index, 1)
      }
    }
  }

  /**
   * 更新节点数据
   */
  updateNode(
    id: NodeID,
    options: Partial<{
      data: (data: T) => T
      parentId: NodeID | null
      childrenId: NodeID | null
    }>,
  ) {
    const node = this.nodes.get(id)
    if (!node) {
      console.warn(`Node with id ${id} does not exist.`)
      return
    }

    const { data, childrenId, parentId } = options

    node.data = data?.(node.data) || node.data

    if (this.isValidId(parentId)) {
      node.parentId = parentId
    }
    node.childrenIds = childrenId
      ? uniq([...node.childrenIds, childrenId]).sort((a, b) => a.localeCompare(b))
      : node.childrenIds
  }

  /**
   * 按ID获取节点
   */
  getNode(id: NodeID | null): TreeNode<T> | undefined {
    return this.isValidId(id) ? this.nodes.get(id) : undefined
  }

  /**
   * 获取父节点
   */
  getParent(id: NodeID): TreeNode<T> | undefined {
    const node = this.nodes.get(id)
    if (this.isValidId(node?.parentId)) {
      return this.nodes.get(node.parentId)
    }
  }

  /**
   * 获取子节点
   */
  getChildren(id: NodeID): TreeNode<T>[] {
    const node = this.nodes.get(id)
    return node?.childrenIds.map((childId) => this.nodes.get(childId)!) || []
  }

  /**
   * 获取所有子节点
   */
  getAllChildren(id: NodeID): TreeNode<T>[] {
    const node = this.nodes.get(id)
    if (!node) return []

    const allChildren: TreeNode<T>[] = []

    const traverse = (currentId: NodeID) => {
      const currentNode = this.nodes.get(currentId)
      if (currentNode) {
        allChildren.push(currentNode)
        currentNode.childrenIds.forEach(traverse)
      }
    }

    traverse(node.id)

    return allChildren
  }

  /**
   * 获取兄弟节点
   */
  getSibling(id: NodeID): TreeNode<T>[] {
    const node = this.nodes.get(id)
    if (!node) return []

    const parent = this.getParent(id)

    if (!parent) return []

    return parent.childrenIds.filter((childId) => childId !== id).map((childId) => this.nodes.get(childId)!)
  }

  /**
   * 广度优先
   */
  traverseBFS(callback: (node: TreeNode<T>) => void): void {
    const queue: NodeID[] = [this.rootId]

    while (queue.length > 0) {
      const currentId = queue.shift()
      if (!currentId) continue
      const currentNode = this.nodes.get(currentId)
      if (!currentNode) continue
      callback(currentNode)
      queue.push(...currentNode.childrenIds)
    }
  }

  /**
   * 深度优先
   */
  traverseDFS(callback: (node: TreeNode<T>) => void): void {
    const dfs = (id: NodeID) => {
      const node = this.nodes.get(id)
      if (node) {
        callback(node)
        node.childrenIds.forEach(dfs)
      }
    }
    dfs(this.rootId)
  }
}
