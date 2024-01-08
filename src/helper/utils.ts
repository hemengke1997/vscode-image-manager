import { Uri, type Webview, env, window, workspace } from 'vscode'

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

export function removeLastSlash(path: string) {
  return path.replace(/\/$/g, '')
}

export function addLastSlash(path: string) {
  return path.replace(/\/?$/g, '/')
}

export function getEnvForWebview() {
  return {
    language: env.language,
  }
}

export function removeUrlProtocol(url: string) {
  return url.replace(/https?:\/\//, '')
}

export function getWorkspaceFolders() {
  return workspace.workspaceFolders
}
