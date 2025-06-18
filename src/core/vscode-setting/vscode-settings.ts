import type { VscodeConfigType } from '../config/common'
import { isFunction } from 'es-toolkit'
import { toLower } from 'es-toolkit/compat'
import { ColorThemeKind, env, type ExtensionContext, window, workspace } from 'vscode'
import { FALLBACK_LANGUAGE, Language, Theme } from '~/meta'
import { Channel } from '~/utils/node/channel'

export class VscodeSettings {
  static reduceMotion: ReduceMotion
  static language: Language
  static theme: Theme

  static init(ctx: ExtensionContext): VscodeConfigType {
    Channel.debug('VscodeSettings init')

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
    const properties = Object.getOwnPropertyNames(VscodeSettings)
    const initMethods = properties.filter(name => name.match(/^init[A-Z].*/) && isFunction(this[name]))
    initMethods.forEach((method) => {
      this[method]()
    })
  }

  static initReduceMotion() {
    const reduceMotion = workspace.getConfiguration('workbench').get<ReduceMotion>('reduceMotion')
    this.reduceMotion = reduceMotion!
  }

  static initLanguage() {
    switch (toLower(env.language)) {
      case 'en':
        this.language = Language.en
        break
      case 'zh-cn':
        this.language = Language.zh_CN
        break
      case 'zh-tw':
        this.language = Language.zh_TW
        break
      case 'ja':
        this.language = Language.ja
        break
      default:
        this.language = FALLBACK_LANGUAGE
        break
    }
  }

  static initTheme() {
    switch (window.activeColorTheme.kind) {
      case ColorThemeKind.Light:
        this.theme = Theme.light
        break
      case ColorThemeKind.Dark:
        this.theme = Theme.dark
        break
      default:
        this.theme = Theme.dark
        break
    }
  }
}
