import { flatten } from '@minko-fe/lodash-pro'
import { type ExtensionModule } from '~/module'
import openWebview from './open-webview'
import resetSettings from './reset-settings'

const m: ExtensionModule = (ctx) => {
  return flatten([openWebview(ctx), resetSettings(ctx)])
}

export * from './commands'
export default m
