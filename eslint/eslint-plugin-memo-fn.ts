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
    // 检查是否在React组件中（不包括hook）
    function isInReactComponent(node: NodeWithParent): boolean {
      let current: NodeWithParent | undefined = node
      while (current?.parent) {
        if (current.type === 'FunctionDeclaration' || current.type === 'FunctionExpression' || current.type === 'ArrowFunctionExpression') {
          // 检查函数名是否以大写字母开头（React组件）
          if ('id' in current && current.id?.name) {
            const name = current.id.name
            if (name[0] === name[0].toUpperCase()) {
              return true
            }
          }
        }
        current = current.parent
      }
      return false
    }

    // 检查是否在hook中（需要跳过）
    function isInHook(node: NodeWithParent): boolean {
      let current: NodeWithParent | undefined = node
      while (current?.parent) {
        if (current.type === 'FunctionDeclaration' || current.type === 'FunctionExpression' || current.type === 'ArrowFunctionExpression') {
          // 检查函数名是否以use开头（hook）
          if ('id' in current && current.id?.name) {
            const name = current.id.name
            if (name.startsWith('use')) {
              return true
            }
          }
        }
        current = current.parent
      }
      return false
    }

    // 检查是否在hook内部
    function isInsideHook(node: NodeWithParent): boolean {
      let current: NodeWithParent | undefined = node
      while (current?.parent) {
        if (current.parent.type === 'CallExpression') {
          const callExpr = current.parent as CallExpressionNode & { parent?: NodeWithParent }
          if (callExpr.callee.type === 'Identifier') {
            const hookName = callExpr.callee.name
            // 检查是否是React hook：以use开头且下一个字母是大写
            if (hookName.startsWith('use') && hookName.length > 3 && hookName[3] === hookName[3].toUpperCase()) {
              return true
            }
          }
        }
        current = current.parent
      }
      return false
    }

    // 检查函数是否已经被useMemoizedFn包裹
    function isWrappedWithUseMemoizedFn(node: NodeWithParent): boolean {
      if (node.parent?.type === 'CallExpression') {
        const callExpr = node.parent as CallExpressionNode & { parent?: NodeWithParent }
        if (callExpr.callee.type === 'Identifier' && callExpr.callee.name === 'useMemoizedFn') {
          return true
        }
      }
      return false
    }

    // 检查是否是React函数组件（需要跳过）
    function isReactFunctionComponent(node: FunctionWithParent): boolean {
      if ('id' in node && node.id?.name) {
        const name = node.id.name
        // React组件以大写字母开头
        return name[0] === name[0].toUpperCase()
      }
      return false
    }

    // 检查是否是hook函数（需要跳过）
    function isHookFunction(node: FunctionWithParent): boolean {
      if ('id' in node && node.id?.name) {
        const name = node.id.name
        // Hook函数以use开头
        return name.startsWith('use')
      }
      return false
    }

    // 检查是否是内联函数（在JSX中直接定义的函数，需要跳过）
    function isInlineFunction(node: NodeWithParent): boolean {
      let current: NodeWithParent | undefined = node
      while (current?.parent) {
        if (current.type === 'JSXElement' || current.type === 'JSXFragment') {
          return true
        }
        current = current.parent
      }
      return false
    }

    // 检查是否是useEffect、useCallback等hook的依赖（需要跳过）
    function isHookDependency(node: NodeWithParent): boolean {
      let current: NodeWithParent | undefined = node
      while (current?.parent) {
        if (current.parent.type === 'CallExpression') {
          const callExpr = current.parent as CallExpressionNode & { parent?: NodeWithParent }
          if (callExpr.callee.type === 'Identifier') {
            const hookName = callExpr.callee.name
            if (['useEffect', 'useCallback', 'useMemo', 'useLayoutEffect'].includes(hookName)) {
              // 检查是否在依赖数组中
              const args = callExpr.arguments
              if (args.length > 1 && args[1] === current) {
                return true
              }
            }
          }
        }
        current = current.parent
      }
      return false
    }

    // 创建自动修复
    function createFix(node: FunctionWithParent, sourceCode: any) {
      const functionText = sourceCode.getText(node)
      return {
        range: node.range,
        text: `useMemoizedFn(${functionText})`,
      }
    }

    return {
      // 检查变量声明中的箭头函数
      VariableDeclarator(node: VariableDeclaratorWithParent) {
        // 如果在hook内部，跳过检查
        if (isInsideHook(node)) {
          return
        }

        // 只检查React组件中的函数，跳过hook中的函数
        if (!isInReactComponent(node) || isInHook(node)) {
          return
        }

        if (node.init && (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression')) {
          const funcNode = node.init as FunctionWithParent

          // 跳过React函数组件
          if (isReactFunctionComponent(funcNode)) {
            return
          }

          // 跳过hook函数
          if (isHookFunction(funcNode)) {
            return
          }

          // 跳过已经被包裹的函数
          if (isWrappedWithUseMemoizedFn(funcNode)) {
            return
          }

          // 跳过hook依赖
          if (isHookDependency(funcNode)) {
            return
          }

          // 跳过内联函数
          if (isInlineFunction(funcNode)) {
            return
          }

          // 检查所有其他函数
          context.report({
            node: funcNode,
            messageId: 'missingUseMemoizedFn',
            fix: (fixer) => {
              const sourceCode = context.getSourceCode()
              const fix = createFix(funcNode, sourceCode)
              return fixer.replaceTextRange(fix.range, fix.text)
            },
          })
        }
      },

      // 检查函数声明
      FunctionDeclaration(node: FunctionDeclarationWithParent) {
        // 如果在hook内部，跳过检查
        if (isInsideHook(node)) {
          return
        }

        // 只检查React组件中的函数，跳过hook中的函数
        if (!isInReactComponent(node) || isInHook(node)) {
          return
        }

        // 跳过React函数组件
        if (isReactFunctionComponent(node)) {
          return
        }

        // 跳过hook函数
        if (isHookFunction(node)) {
          return
        }

        // 跳过已经被包裹的函数
        if (isWrappedWithUseMemoizedFn(node)) {
          return
        }

        // 跳过hook依赖
        if (isHookDependency(node)) {
          return
        }

        // 跳过内联函数
        if (isInlineFunction(node)) {
          return
        }

        // 检查所有其他函数
        context.report({
          node,
          messageId: 'missingUseMemoizedFn',
          fix: (fixer) => {
            const sourceCode = context.getSourceCode()
            const fix = createFix(node, sourceCode)
            return fixer.replaceTextRange(fix.range, fix.text)
          },
        })
      },
    }
  },
}

export default {
  rules: {
    'use-memoized-fn': rule,
  },
}
