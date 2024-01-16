import { cloneDeep } from '@minko-fe/lodash-pro'
import { Context } from '@rootSrc/Context'
import { Log } from '@rootSrc/utils/Log'
import { execa } from 'execa'
import jsonfile from 'jsonfile'
import path from 'node:path'
import * as vscode from 'vscode'

async function checkNpmInstalled() {
  try {
    const { stdout } = await execa('npm', ['-v'])
    Log.info(`npm version: ${stdout}`)
    if (stdout) return true
  } catch {
    return false
  }
}

async function npmInstall(extUri: string) {
  const res = await execa('npm', ['install'], {
    cwd: extUri,
    stdio: 'pipe',
  })

  Log.info(`npm install: ${JSON.stringify(res)}`)

  if (res.stderr) {
    Log.error(`npm install error: ${res.stderr}`)
  }

  if (res.stdout) {
    const pkgJson = jsonfile.readFileSync(path.posix.join(extUri, './package.json')) as Record<string, any>
    Log.info(`Dependencies: ${JSON.stringify(pkgJson.dependencies)}`)
    Log.info(`npm install: ${res.stdout}`)
  }

  return res
}

function updatePackgeJson(extUri: string) {
  const originalPkgJson = jsonfile.readFileSync(path.posix.join(extUri, './package.json')) as Record<string, any>
  const pkgJson = cloneDeep(originalPkgJson)

  if (pkgJson) {
    const sharp = pkgJson.devDependencies.sharp
    pkgJson.dependencies = {
      ...pkgJson.dependencies,
      sharp,
    }
    pkgJson.devDependencies = {}

    jsonfile.writeFileSync(path.posix.join(extUri, './package.json'), pkgJson)
  }

  return originalPkgJson
}

async function installSharp(extUri: string): Promise<'success' | 'fail' | 'installed'> {
  try {
    try {
      const sharp = require('sharp')
      if (sharp) return 'installed'
    } catch (e) {
      Log.error(`sharp not installed: ${e}`)
    }

    const pkgJson = updatePackgeJson(extUri)
    const { stdout, failed } = await npmInstall(extUri)
    recoverPkgJson(extUri, pkgJson)

    if (stdout && !failed) {
      if (stdout.includes('up to date')) return 'installed'
      return 'success'
    }

    return 'fail'
  } catch (e) {
    return 'fail'
  }
}

function recoverPkgJson(extUri: string, pkgJson: Record<string, any>) {
  jsonfile.writeFileSync(path.posix.join(extUri, './package.json'), pkgJson)
}

export async function initSharp(): Promise<boolean> {
  const npmInstalled = await checkNpmInstalled()

  Log.info(`npmInstalled: ${npmInstalled}`)

  if (!npmInstalled) return false

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)

  statusBarItem.text = 'Image Compressor installing...'

  Log.info('Image Compressor installing...')

  statusBarItem.show()

  const extensionLocaltion = Context.instance.ext.extensionUri.fsPath
  Log.info(`extension location: ${extensionLocaltion}`)
  const res = await installSharp(extensionLocaltion)
  statusBarItem.hide()

  Log.info(`install sharp result: ${res}`)

  switch (res) {
    case 'success':
      Log.info('sharp ready to work')
      vscode.window
        .showInformationMessage('Image Compressor installed successfully, Please reload VSCode', 'Reload')
        .then((res) => {
          if (res === 'Reload') {
            // try to avoid vscode issue `Extensions have been modified on disk. Please reload the window.`
            vscode.commands.executeCommand('workbench.action.reloadWindow')
          }
        })
      return true
    case 'fail':
      Log.error('Failed to install sharp')
      return false
    case 'installed':
      Log.info('sharp already installed')
      return true
    default:
      return false
  }
}
