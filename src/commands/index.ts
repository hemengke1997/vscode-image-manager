import { flatten } from 'lodash-es'
import { type ExtensionModule } from '~/module'
import clearCache from './clear-cache'
import openWebview from './open-webview'
import resetSettings from './reset-settings'
import showChannel from './show-channel'
import svgo from './svgo'

const m: ExtensionModule = (ctx) => {
  return flatten([openWebview, resetSettings, showChannel, clearCache, svgo].map((fn) => fn(ctx)))
}

export * from './commands'
export default m
