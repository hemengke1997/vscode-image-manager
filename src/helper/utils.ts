import { Uri, type Webview, env, window, workspace } from 'vscode'

export const getProjectPath = () => {
  try {
    const workspaceFolders = workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return ''
    }
    if (workspaceFolders.length > 1) {
      console.error('more than one workspaceFolders')
    }
    return workspaceFolders[0].uri.fsPath
  } catch (error) {
    showError('workspace not found')
  }
  return ''
}

let lastLogTimestamp = 0

const logMsg = (text: any) => {
  const now = new Date()
  const gap = now.getTime() - lastLogTimestamp
  // add some blank rows
  if (gap > 5 * 1000) {
    if (gap > 120 * 1000) {
      console.log('\n\n')
    }
    console.log('')
  }
  lastLogTimestamp = now.getTime()
  console.log(`${new Date().toISOString()} ${text}`)
}

export const Log = {
  info: (text: any, ...args: any[]) => logMsg(`[Info] ${text} ${args.join('')}`),
  warn: (text: any) => logMsg(`[Warn] ${text}`),
  error: (text: any) => logMsg(`[Error] ${text}`),
}

export const showInfo = (text: any) => {
  window.showInformationMessage(text)
  Log.info(text)
}
export const showError = (text: any) => {
  window.showErrorMessage(text)
  Log.error(text)
}

export function getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
  return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList))
}

export function slash(path: string) {
  return path.replace(/\\/g, '/')
}

export function getEnvForWebview() {
  return {
    language: env.language,
  }
}

/**
 * A helper function that returns a unique alphanumeric identifier called a nonce.
 *
 * @remarks This function is primarily used to help enforce content security
 * policies for resources/scripts being executed in a webview context.
 *
 * @returns A nonce
 */
export function getNonce() {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

export function removeUrlProtocol(url: string) {
  return url.replace(/https?:\/\//, '')
}
