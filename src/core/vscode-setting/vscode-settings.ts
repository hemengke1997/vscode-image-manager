import type { ExtensionContext } from 'vscode'
import type { VscodeConfigType } from '../config/common'
import { isFunction } from 'es-toolkit'
import { toLower } from 'es-toolkit/compat'
import { ColorThemeKind, env, window, workspace } from 'vscode'
import { FALLBACK_LANGUAGE, Language, Theme } from '~/meta'
import { Channel } from '~/utils/node/channel'

export class VscodeSettings {
  private static reduceMotion: ReduceMotion
  private static language: Language
  private static theme: Theme

  static init(ctx: ExtensionContext, callback: (settings: VscodeConfigType) => void): VscodeConfigType {
    Channel.debug('VscodeSettings init')

    const callbackSettings = () => {
      callback({
        theme: this.theme,
        language: this.language,
        reduceMotion: this.reduceMotion,
      })
    }

    ctx.subscriptions.push(window.onDidChangeActiveColorTheme(() => {
      Channel.debug('VscodeSettings onDidChangeActiveColorTheme')
      this.initTheme()
      callbackSettings()
    }))
    ctx.subscriptions.push(
      workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('workbench.reduceMotion')) {
          Channel.debug('VscodeSettings onDidChangeConfiguration')
          this.initReduceMotion()
          callbackSettings()
        }
      }),
    )

    this.invokeInitMethods()
    callbackSettings()

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

    return this.theme
  }
}
