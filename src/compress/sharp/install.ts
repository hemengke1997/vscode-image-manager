import { Context } from '@rootSrc/Context'
import { Log } from '@rootSrc/utils/Log'
import { execa } from 'execa'
import jsonfile from 'jsonfile'
import fs from 'node:fs'
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

async function npmInstall(extUri: string, pkgJson: Record<string, any>) {
  Log.info(`Install Dependencies: ${JSON.stringify(pkgJson.dependencies)}`)
  Log.info(`Install DevDependencies: ${JSON.stringify(pkgJson.devDependencies)}`)

  try {
    const res = await execa('npm', ['install'], {
      cwd: extUri,
      stdio: 'pipe',
    })

    if (res.stderr) {
      Log.error(`npm install error: ${res.stderr}`)
    }

    if (res.stdout) {
      Log.info(`npm install: ${res.stdout}`)
    }

    return res
  } catch (e) {
    Log.error(`npm install error: ${e}`)

    const res = await vscode.window.showErrorMessage('Image Compressor install failed, Please try again', 'Retry')

    if (res === 'Retry') {
      return npmInstall(extUri, pkgJson)
    }

    return undefined
  }
}

function updatePackgeJson(extUri: string) {
  const pkgJsonPath = path.join(extUri, './package.json')
  const pkgJsonBakPath = path.join(extUri, './package.json.bak')

  if (fs.existsSync(pkgJsonPath)) {
    fs.copyFileSync(pkgJsonPath, pkgJsonBakPath)
  }

  const pkgJson = jsonfile.readFileSync(pkgJsonPath) as Record<string, any>

  if (pkgJson) {
    const sharp = pkgJson.devDependencies.sharp
    pkgJson.dependencies = {
      ...pkgJson.dependencies,
      sharp,
    }
    pkgJson.devDependencies = {}

    Log.info(`Updated Dependencies: ${JSON.stringify(pkgJson.dependencies)}`)

    writePkgJson(extUri, pkgJson)
  }

  return { updatedPkgJson: pkgJson, pkgJsonBakPath }
}

async function installSharp(extUri: string): Promise<'success' | 'fail' | 'installed'> {
  try {
    try {
      const sharp = require('sharp')
      if (sharp) {
        Log.info('require sharp success')
        return 'installed'
      }
    } catch (e) {
      Log.error(`sharp not installed: ${e}`)
    }

    const { pkgJsonBakPath, updatedPkgJson } = updatePackgeJson(extUri)
    const { stdout, failed } = (await npmInstall(extUri, updatedPkgJson)) || { stdout: '', failed: true }
    pkgJsonBakPath && fs.copyFileSync(pkgJsonBakPath, path.join(extUri, './package.json'))
    fs.unlinkSync(pkgJsonBakPath)

    if (stdout && !failed) {
      if (stdout.includes('up to date')) return 'installed'
      return 'success'
    }

    return 'fail'
  } catch (e) {
    return 'fail'
  }
}

function writePkgJson(extUri: string, pkgJson: Record<string, any>) {
  jsonfile.writeFileSync(path.join(extUri, './package.json'), pkgJson, {
    encoding: 'utf-8',
    spaces: 2,
  })
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
