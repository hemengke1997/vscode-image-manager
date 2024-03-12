import { type ConfigType } from '~/core/config/common'

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
  const newAppearance = {
    ...appearance,
    theme: weightByKey(extTheme, theme, 'auto'),
    language: weightByKey(extLanguage, language, 'auto'),
  }
  return {
    ...extConfig,
    appearance: newAppearance,
  }
}

/**
 * @description 根据配置的字段判断权重
 */
export function weightByKey<T>(lower: T, higher: T, k: T) {
  return lower === k ? higher : lower
}
