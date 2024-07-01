import { flatten } from '@minko-fe/lodash-pro'
import { type ExtensionModule } from '~/module'
import clearCache from './clear-cache'
import mirror from './mirror'
import openWebview from './open-webview'
import resetSettings from './reset-settings'
import selectLanguage from './select-language'
import showChannel from './show-channel'

const m: ExtensionModule = (ctx) => {
  return flatten([openWebview, resetSettings, showChannel, mirror, selectLanguage, clearCache].map((fn) => fn(ctx)))
}

export * from './commands'
export default m
