import { lowerCase } from '@minko-fe/lodash-pro'
import { env } from 'vscode'
import { FALLBACK_LANGUAGE } from '~/meta'

export class VscodeLanguage {
  /**
   * vscode language
   */
  static vscodeLanguage: Language

  static init() {
    switch (lowerCase(env.language)) {
      case 'en':
        this.vscodeLanguage = 'en'
        break
      case 'zh-cn':
        this.vscodeLanguage = 'zh-CN'
        break
      default:
        this.vscodeLanguage = FALLBACK_LANGUAGE
        break
    }
  }
}
