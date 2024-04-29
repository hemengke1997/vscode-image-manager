import { isFunction, lowerCase } from '@minko-fe/lodash-pro'
import { type ExtensionContext, env, window, workspace } from 'vscode'
import { FALLBACK_LANGUAGE } from '~/meta'
import { type VscodeConfigType } from '../config/common'

export class VscodeSettings {
  static reduceMotion: ReduceMotion
  static language: Language
  static theme: Theme

  static init(ctx: ExtensionContext): VscodeConfigType {
    ctx.subscriptions.push(window.onDidChangeActiveColorTheme(() => this.initTheme()))
    ctx.subscriptions.push(
      workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('workbench.reduceMotion')) {
          this.initReduceMotion()
        }
      }),
    )

    this.invokeInitMethods()

    return {
      language: this.language,
      theme: this.theme,
      reduceMotion: this.reduceMotion,
    }
  }

  static invokeInitMethods() {
    const properties = Object.getOwnPropertyNames(VscodeSettings.prototype)
    const initMethods = properties.filter((name) => name.match(/^init[A-Z].*/) && isFunction(this[name]))
    initMethods.forEach((property) => {
      this[property].call(this)
    })
  }

  static initReduceMotion() {
    const reduceMotion = workspace.getConfiguration('workbench').get<ReduceMotion>('reduceMotion')
    this.reduceMotion = reduceMotion!
  }

  static initLanguage() {
    switch (lowerCase(env.language)) {
      case 'en':
        this.language = 'en'
        break
      case 'zh-cn':
        this.language = 'zh-CN'
        break
      default:
        this.language = FALLBACK_LANGUAGE
        break
    }
  }

  static initTheme() {
    switch (window.activeColorTheme.kind) {
      case 1:
        this.theme = 'light'
        break
      case 2:
        this.theme = 'dark'
        break
      default:
        this.theme = 'dark'
        break
    }
  }
}
