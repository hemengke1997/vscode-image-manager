import type { ConfigType } from '~/core/config/common'
import { produce } from 'immer'
import { Language, Theme } from '~/meta'
import { intelligentPick } from '~/utils/'

/**
 * @description 从`auto`智能选择配置
 */
export function intelligentPickConfig(
  extConfig: ConfigType,
  vscodeConfig: {
    theme: Theme
    language: Language
  },
) {
  const { theme, language } = vscodeConfig
  const { appearance } = extConfig
  const { theme: extTheme, language: extLanguage } = appearance

  return produce(extConfig, (draft) => {
    draft.appearance.theme = intelligentPick(extTheme, theme, Theme.auto)
    draft.appearance.language = intelligentPick(extLanguage, language, Language.auto)
  })
}

export function getAppRoot() {
  return document.querySelector('#root') as HTMLElement
}
