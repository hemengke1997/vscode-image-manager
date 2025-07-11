import type { Buffer } from 'node:buffer'
import type { ObjectPlugin } from '../hook-plugin'
import type { SharpNS } from '~/@types/global'
import process from 'node:process'
import fs from 'fs-extra'
import { env, Uri, window } from 'vscode'
import { i18n } from '~/i18n'
import logger from '~/utils/logger'
import { Global } from '../global'
import { HookPlugin } from '../hook-plugin'

type HookResult<T = void> = Promise<T> | T

type RuntimeHooks<T extends AnyObject, RuntimeCtx extends AnyObject = T & OperatorInput> = {
  'on:configuration': (ctx: Context<RuntimeCtx>) => HookResult<SharpNS.SharpOptions | undefined>
  'before:run': (ctx: Context<RuntimeCtx>) => HookResult
  'after:run': (ctx: Context<RuntimeCtx>, res: { outputPath: string }) => HookResult
  'on:finish': (ctx: Context<RuntimeCtx>, res: { outputPath: string }) => HookResult
  'on:generate-output-path': (ctx: Context<RuntimeCtx>) => HookResult<string>
}

class Context<T extends AnyObject, RuntimeCtx extends AnyObject = T & OperatorInput> {
  sharp: SharpNS.Sharp | undefined
  sharpFactory: TSharp | undefined
  runtime: RuntimeCtx

  constructor() {
    this.sharp = {} as SharpNS.Sharp
    this.sharpFactory = {} as TSharp
    this.runtime = {} as RuntimeCtx
    return this
  }
}

type OperatorInput = {
  input: Parameters<TSharp>[0]
}

export class SharpOperator<T extends AnyObject, RuntimeCtx extends AnyObject = T & OperatorInput> extends HookPlugin<
  RuntimeHooks<T, RuntimeCtx>
> {
  ctx: Context<RuntimeCtx>

  constructor(option?: { plugins: ObjectPlugin<RuntimeHooks<T, RuntimeCtx>>[] }) {
    super(option)

    this.ctx = new Context<RuntimeCtx>()
    try {
      const sharp = Global.sharp
      this.ctx.sharpFactory = sharp
    }
    catch {}
  }

  async run(
    runtime: RuntimeCtx & OperatorInput,
    options?: {
      dryRun?: boolean
    },
  ): Promise<{
    outputPath: string
    buffer: Buffer
  }> {
    if (!this.ctx.sharp) {
      const noSharpTip = i18n.t('core.dep_install_fail')
      const viewSolutionTip = i18n.t('core.view_solution')
      window.showErrorMessage(noSharpTip, viewSolutionTip).then((res) => {
        if (res === viewSolutionTip) {
          env.openExternal(Uri.parse(process.env.IM_QA_URL || ''))
        }
      })
      return Promise.reject(new Error(noSharpTip))
    }

    const { dryRun } = options || {}

    this.ctx.runtime = runtime

    const { input } = this.ctx.runtime

    this.ctx.sharpFactory?.cache({ memory: 200 })

    this.ctx.sharp = this.ctx.sharpFactory?.(input, {
      ...((await this.hooks.callHook('on:configuration', this.ctx)) || {}),
    })

    await this.hooks.callHook('before:run', this.ctx)

    const outputPath = await this.hooks.callHook('on:generate-output-path', this.ctx)

    return new Promise((resolve, reject) => {
      this.ctx.sharp
        ?.toBuffer()
        .then(async (buffer) => {
          const result = {
            outputPath,
            buffer,
          }

          await this.hooks.callHook('after:run', this.ctx, { outputPath })

          await fs.ensureFile(outputPath)

          if (dryRun) {
            await this.hooks.callHook('on:finish', this.ctx, result)
            return resolve(result)
          }

          await fs.access(outputPath, fs.constants.W_OK)
          const fileWritableStream = fs.createWriteStream(outputPath)
          fileWritableStream.on('finish', async () => {
            try {
              await this.hooks.callHook('on:finish', this.ctx, result)
            }
            finally {
              resolve(result)
            }
          })

          // TODO: 修复 win32 写入文件时报错：
          // UNKNOWN: unknown error, open '...jpg'
          fileWritableStream.on('error', (e) => {
            logger.error(e)
            reject(e)
          })

          fileWritableStream.end(buffer)
        })
        .catch((e) => {
          reject(e)
        })
    })
  }
}
