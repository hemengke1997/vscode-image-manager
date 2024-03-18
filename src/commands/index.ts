import { flatten } from '@minko-fe/lodash-pro'
import { type ExtensionModule } from '~/module'
import openWebview from './open-webview'
import resetSettings from './reset-settings'
import showChannel from './show-channel'

const m: ExtensionModule = (ctx) => {
  return flatten([openWebview, resetSettings, showChannel].map((fn) => fn(ctx)))
}

export * from './commands'
export default m
