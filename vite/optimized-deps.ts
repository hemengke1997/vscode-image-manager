/* eslint-disable no-control-regex */
import type { PluginOption } from 'vite'
import path from 'node:path'
import process from 'node:process'
import { isString } from 'es-toolkit'
import fs from 'fs-extra'

const depsFilePath = 'vite/optimized-deps.txt'

// 创建一个全局的console.log处理器链
const consoleLogHandlers: Array<(...args: any[]) => void> = []

// 保存原始的console.log
const originalConsoleLog = console.log

// 创建代理函数
function createConsoleLogProxy() {
  return (...args: any[]) => {
    // 先调用原始console.log
    originalConsoleLog(...args)

    // 然后调用所有注册的处理器
    consoleLogHandlers.forEach((handler) => {
      try {
        handler(...args)
      }
      catch (error) {
        console.error('Console log handler error:', error)
      }
    })
  }
}

async function readOptimizeDepsFile(filepath: string) {
  const content = await fs.readFile(path.resolve(process.cwd(), filepath), 'utf-8')
  const deps = content
    .split('\n')
    .filter(Boolean)
    .map(dep => dep.trim())

  return deps || []
}

function stripAnsiColors(str: string): string {
  // 更全面的ANSI代码清理
  return str
    // 移除所有ANSI转义序列
    .replace(/\x1B\[[0-9;]*[a-z]/gi, '')
    // 移除其他可能的控制字符
    .replace(/[\u001B\u009B][[()#;?]*(?:\d{1,4}(?:;\d{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
    // 移除颜色代码
    .replace(/\x1B\[[0-9;]*m/g, '')
    // 移除光标控制代码
    .replace(/\x1B\[\d*[A-D]/g, '')
    // 移除其他可能的转义序列
    .replace(/\x1B\[\d*[JK]/g, '')
}

export function optimizeDeps(): PluginOption {
  return {
    name: 'vite:optimized-deps',
    apply: 'serve',
    enforce: 'pre',
    async config() {
      const deps = await readOptimizeDepsFile(depsFilePath)

      return {
        optimizeDeps: {
          include: [...deps, 'image-manager/hooks/**', 'react-icons/**'],
        },
      }
    },
    configureServer(server) {
      // 创建处理器函数
      const depsHandler = async (...args: any[]) => {
        const matchText = '✨ new dependencies optimized:'

        // 查找包含目标文本的参数
        const targetArg = args.find(t => isString(t) && t.includes(matchText))

        if (targetArg) {
          // 清理ANSI颜色代码
          const cleanTarget = stripAnsiColors(targetArg as string)

          // 提取依赖列表
          const newDeps = cleanTarget
            .substring(cleanTarget.indexOf(matchText) + matchText.length)
            .trim()
            .split(',')
            .map(t => t.trim())
            .filter(Boolean)

          if (newDeps.length > 0) {
            const deps = await readOptimizeDepsFile(depsFilePath)
            const allDeps = new Set([...deps, ...newDeps])
            await fs.writeFile(path.resolve(process.cwd(), depsFilePath), [...allDeps].join('\n'), 'utf8')

            server.config.logger.info(
              `[image-manager]: add deps to ${depsFilePath}`,
              {
                timestamp: true,
              },
            )
          }
        }
      }

      // 注册处理器
      consoleLogHandlers.push(depsHandler)

      // 如果console.log还没有被代理，则设置代理
      if (console.log === originalConsoleLog) {
        console.log = createConsoleLogProxy()
      }

      // 在服务器关闭时清理处理器
      server.httpServer?.on('close', () => {
        const index = consoleLogHandlers.indexOf(depsHandler)
        if (index > -1) {
          consoleLogHandlers.splice(index, 1)
        }

        // 如果没有处理器了，恢复原始console.log
        if (consoleLogHandlers.length === 0) {
          console.log = originalConsoleLog
        }
      })
    },
  }
}
