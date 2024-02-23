import { flatten } from '@minko-fe/lodash-pro'
import { type ExtensionModule } from '~/module'
import openWebview from './openWebview'

const m: ExtensionModule = (ctx) => {
  return flatten([openWebview(ctx)])
}

export * from './commands'
export default m
