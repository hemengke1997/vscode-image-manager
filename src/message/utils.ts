import { ConfigurationTarget, workspace } from 'vscode'
import { EXT_NAMESPACE } from '~/meta'

let updateVscodeConfigTimeoutId: NodeJS.Timeout | null = null
export function debounceUpdateVscodeConfig(options: {
  key: string
  value: any
  target: ConfigurationTarget
  wait?: number
}) {
  return new Promise((resolve, reject) => {
    if (updateVscodeConfigTimeoutId) {
      clearTimeout(updateVscodeConfigTimeoutId)
    }

    const { key, value, target = ConfigurationTarget.Global, wait = 1000 } = options

    updateVscodeConfigTimeoutId = setTimeout(async () => {
      try {
        await workspace.getConfiguration().update(`${EXT_NAMESPACE}.${key}`, value, target)
        resolve(true)
      } catch (error) {
        reject(error)
      } finally {
        updateVscodeConfigTimeoutId = null
      }
    }, wait)
  })
}
