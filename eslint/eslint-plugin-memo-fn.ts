/**
 * Cursor agent 生成的eslint插件
 */

import type { TSESTree } from '@typescript-eslint/utils'
import type { Rule } from 'eslint'

type Node = TSESTree.Node
type VariableDeclaratorNode = TSESTree.VariableDeclarator
type CallExpressionNode = TSESTree.CallExpression

// 定义包含parent属性的节点类型
type NodeWithParent = Node & {
  parent?: NodeWithParent
}

// 定义具体的节点类型
type VariableDeclaratorWithParent = VariableDeclaratorNode & { parent?: NodeWithParent }
type FunctionDeclarationWithParent = TSESTree.FunctionDeclaration & { parent?: NodeWithParent }
type FunctionExpressionWithParent = TSESTree.FunctionExpression & { parent?: NodeWithParent }
type ArrowFunctionExpressionWithParent = TSESTree.ArrowFunctionExpression & { parent?: NodeWithParent }
type FunctionWithParent = FunctionDeclarationWithParent | FunctionExpressionWithParent | ArrowFunctionExpressionWithParent

// 工具类：节点检查器
class NodeChecker {
  /**
   * 检查是否是React Hook
   */
  static isHook(name: string): boolean {
    return name.startsWith('use') && name.length > 3 && name[3] === name[3].toUpperCase()
  }

  /**
   * 检查是否是React组件名（以大写字母开头）
   */
  static isReactComponent(name: string): boolean {
    return name[0] === name[0].toUpperCase()
  }

  /**
   * 获取函数名称
   */
  static getFunctionName(node: FunctionWithParent): string | null {
    return 'id' in node && node.id?.name ? node.id.name : null
  }

  /**
   * 向上遍历AST树查找符合条件的父节点
   */
  static findParentByCondition(
    node: NodeWithParent,
    condition: (node: NodeWithParent) => boolean,
  ): NodeWithParent | null {
    let current: NodeWithParent | undefined = node
    while (current?.parent) {
      if (condition(current)) {
        return current
      }
      current = current.parent
    }
    return null
  }

  /**
   * 检查是否在React组件中（不包括hook）
   */
  static isInReactComponent(node: NodeWithParent): boolean {
    return this.findParentByCondition(node, (current) => {
      if (this.isFunctionNode(current)) {
        const name = this.getFunctionName(current as FunctionWithParent)
        return name ? this.isReactComponent(name) : false
      }
      return false
    }) !== null
  }

  /**
   * 检查是否在hook中
   */
  static isInHook(node: NodeWithParent): boolean {
    return this.findParentByCondition(node, (current) => {
      if (this.isFunctionNode(current)) {
        const name = this.getFunctionName(current as FunctionWithParent)
        return name ? this.isHook(name) : false
      }
      return false
    }) !== null
  }

  /**
   * 检查是否在hook内部（作为hook的参数）
   */
  static isInsideHook(node: NodeWithParent): boolean {
    return this.findParentByCondition(node, (current) => {
      if (current.type === 'CallExpression') {
        const callExpr = current as CallExpressionNode & { parent?: NodeWithParent }
        if (callExpr.callee.type === 'Identifier') {
          return this.isHook(callExpr.callee.name)
        }
      }
      return false
    }) !== null
  }

  /**
   * 检查函数是否已经被useMemoizedFn包裹
   */
  static isWrappedWithUseMemoizedFn(node: NodeWithParent): boolean {
    if (node.parent?.type === 'CallExpression') {
      const callExpr = node.parent as CallExpressionNode & { parent?: NodeWithParent }
      return callExpr.callee.type === 'Identifier' && callExpr.callee.name === 'useMemoizedFn'
    }
    return false
  }

  /**
   * 检查是否是React函数组件
   */
  static isReactFunctionComponent(node: FunctionWithParent): boolean {
    const name = this.getFunctionName(node)
    return name ? this.isReactComponent(name) : false
  }

  /**
   * 检查是否是hook函数
   */
  static isHookFunction(node: FunctionWithParent): boolean {
    const name = this.getFunctionName(node)
    return name ? this.isHook(name) : false
  }

  /**
   * 检查是否是内联函数（在JSX中直接定义的函数）
   */
  static isInlineFunction(node: NodeWithParent): boolean {
    return this.findParentByCondition(node, (current) => {
      return current.type === 'JSXElement' || current.type === 'JSXFragment'
    }) !== null
  }

  /**
   * 检查是否是函数节点
   */
  private static isFunctionNode(node: NodeWithParent): boolean {
    return node.type === 'FunctionDeclaration'
      || node.type === 'FunctionExpression'
      || node.type === 'ArrowFunctionExpression'
  }
}

// 工具类：函数处理器
class FunctionProcessor {
  /**
   * 创建自动修复
   */
  static createFix(node: FunctionWithParent, sourceCode: any) {
    const functionText = sourceCode.getText(node)

    // 如果是函数声明，需要转换为const声明格式
    if (node.type === 'FunctionDeclaration') {
      const functionName = NodeChecker.getFunctionName(node)
      if (functionName) {
        // 如果函数有参数，不进行自动修复（避免类型丢失）
        if (node.params.length > 0) {
          return null
        }

        // 提取函数体
        const bodyText = sourceCode.getText(node.body)

        // 构造箭头函数
        const arrowFunction = `() => ${bodyText}`

        return {
          range: node.range,
          text: `const ${functionName} = useMemoizedFn(${arrowFunction})`,
        }
      }
    }

    // 对于箭头函数和函数表达式，直接包裹
    return {
      range: node.range,
      text: `useMemoizedFn(${functionText})`,
    }
  }

  /**
   * 检查函数是否需要使用useMemoizedFn
   */
  static shouldUseMemoizedFn(node: FunctionWithParent, context: any): boolean {
    // 如果在hook内部（作为hook的参数），跳过检查
    if (NodeChecker.isInsideHook(node)) {
      return false
    }

    // 检查是否在React组件或自定义hook中
    const isInReactComponent = NodeChecker.isInReactComponent(node)
    const isInHook = NodeChecker.isInHook(node)

    // 如果既不在React组件中，也不在自定义hook中，跳过检查
    if (!isInReactComponent && !isInHook) {
      return false
    }

    // 跳过React函数组件本身
    if (NodeChecker.isReactFunctionComponent(node)) {
      return false
    }

    // 跳过hook函数本身
    if (NodeChecker.isHookFunction(node)) {
      return false
    }

    // 跳过已经被包裹的函数
    if (NodeChecker.isWrappedWithUseMemoizedFn(node)) {
      return false
    }

    // 跳过内联函数
    if (NodeChecker.isInlineFunction(node)) {
      return false
    }

    return true
  }

  /**
   * 报告缺少useMemoizedFn的函数
   */
  static reportMissingUseMemoizedFn(node: FunctionWithParent, context: any) {
    const fix = this.createFix(node, context.getSourceCode())

    context.report({
      node,
      messageId: 'missingUseMemoizedFn',
      ...(fix && { fix: (fixer: any) => fixer.replaceTextRange(fix.range, fix.text) }),
    })
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce useMemoizedFn for all functions declared in React components to ensure stable function references',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      missingUseMemoizedFn: 'Function should be wrapped with useMemoizedFn to ensure stable function reference and prevent unnecessary re-renders',
    },
  },
  // @ts-expect-error Eslint
  create(context) {
    return {
      // 检查变量声明中的箭头函数
      VariableDeclarator(node: VariableDeclaratorWithParent) {
        if (node.init && (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression')) {
          const funcNode = node.init as FunctionWithParent

          if (FunctionProcessor.shouldUseMemoizedFn(funcNode, context)) {
            FunctionProcessor.reportMissingUseMemoizedFn(funcNode, context)
          }
        }
      },

      // 检查函数声明
      FunctionDeclaration(node: FunctionDeclarationWithParent) {
        if (FunctionProcessor.shouldUseMemoizedFn(node, context)) {
          FunctionProcessor.reportMissingUseMemoizedFn(node, context)
        }
      },
    }
  },
}

export default {
  rules: {
    'use-memoized-fn': rule,
  },
}
