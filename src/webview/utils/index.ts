import { produce } from 'immer'
import { type ConfigType } from '~/core/config/common'
import { intelligentPick } from '~/utils/intelligent-pick'

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
    draft.appearance.theme = intelligentPick(extTheme, theme, 'auto')
    draft.appearance.language = intelligentPick(extLanguage, language, 'auto')
  })
}

export function getAppRoot() {
  return document.querySelector('#root') as HTMLElement
}
