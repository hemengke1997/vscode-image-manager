import fs from 'fs-extra'
import { env, Uri, window } from 'vscode'
import { type SharpNS } from '~/@types/global'
import { i18n } from '~/i18n'
import { Channel } from '~/utils/channel'
import { Global } from '..'
import { HookPlugin, type ObjectPlugin } from '../hook-plugin'

type HookResult<T = void> = Promise<T> | T

interface RuntimeHooks<T extends AnyObject, RuntimeCtx extends AnyObject = T & OperatorInput> {
  'on:configuration': (ctx: Context<RuntimeCtx>) => HookResult<SharpNS.SharpOptions | undefined>
  'before:run': (ctx: Context<RuntimeCtx>) => HookResult
  'after:run': (ctx: Context<RuntimeCtx>, res: { outputPath: string }) => HookResult
  'on:finish': (ctx: Context<RuntimeCtx>, res: { outputPath: string }) => HookResult
  'on:generate-output-path': (ctx: Context<RuntimeCtx>) => HookResult<string>
}

class Context<T extends AnyObject, RuntimeCtx extends AnyObject = T & OperatorInput> {
  sharp: SharpNS.Sharp
  sharpFactory: TSharp
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
    } catch {}
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

    this.ctx.sharpFactory.cache({ memory: 200 })

    this.ctx.sharp = this.ctx.sharpFactory(input, {
      ...((await this.hooks.callHook('on:configuration', this.ctx)) || {}),
    })

    await this.hooks.callHook('before:run', this.ctx)

    const outputPath = await this.hooks.callHook('on:generate-output-path', this.ctx)

    return new Promise((resolve, reject) => {
      this.ctx.sharp
        .toBuffer()
        .then(async (buffer) => {
          const result = {
            outputPath,
            buffer,
          }

          try {
            await this.hooks.callHook('after:run', this.ctx, { outputPath })

            fs.ensureFileSync(outputPath)

            if (dryRun) {
              await this.hooks.callHook('on:finish', this.ctx, result)
              return resolve(result)
            }

            fs.access(outputPath, fs.constants.W_OK, (err) => {
              if (err) {
                Channel.error(err.message)
                reject(err)
              } else {
                const fileWritableStream = fs.createWriteStream(outputPath)
                fileWritableStream.on('finish', async () => {
                  try {
                    await this.hooks.callHook('on:finish', this.ctx, result)
                  } finally {
                    resolve(result)
                  }
                })
                fileWritableStream.write(buffer)
                fileWritableStream.end()
              }
            })
          } catch (e) {
            reject(e)
          }
        })
        .catch((e) => {
          reject(e)
        })
    })
  }
}
