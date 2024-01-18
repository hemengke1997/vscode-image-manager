import { Log } from '@rootSrc/utils/Log'
import { execa } from 'execa'
import fs from 'fs-extra'
import path from 'node:path'
import { Emitter } from 'strict-event-emitter'
import * as vscode from 'vscode'
import { Context } from './Context'

type DepsInstallResult = 'installed' | 'success' | 'fail' | null

type Events = {
  'install-success': []
  'install-fail': []
}

export class Deps extends Emitter<Events> {
  cwd: string
  installResult: DepsInstallResult = null
  private _packageJsonPath: string
  private _packageJsonBakPath: string
  private _cachePath: string

  constructor() {
    super()
    this.cwd = Context.instance.ext.extensionUri.fsPath
    Log.info(`Extension cwd: ${this.cwd}`)

    this._packageJsonPath = path.join(this.cwd, './package.json')
    this._packageJsonBakPath = path.join(this.cwd, './package.bak.json')

    this._cachePath = path.join(this.cwd, './.cache.json')
    if (!fs.existsSync(this._cachePath)) {
      fs.writeJsonSync(this._cachePath, {
        installed: false,
      })
    }
  }

  async init(): Promise<boolean> {
    const npmInstalled = await this._checkNpmInstalled()
    Log.info(`User Npm Installed: ${npmInstalled}`)
    if (!npmInstalled) return false
    const depsInstalled = await this._isDepsInstalled()
    Log.info(`Image Manager Dependencies Installed: ${depsInstalled}`)
    if (depsInstalled) return true

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)

    statusBarItem.text = 'Image Manager Dependencies installing...'

    Log.info('Dependencies installing...')

    statusBarItem.show()

    const res = await this._installNecessaryDeps()

    this.installResult = res

    statusBarItem.hide()

    switch (res) {
      case 'success':
        Log.info('Dependencies installed successfully')
        this.emit('install-success')
        return true
      case 'fail':
        Log.error('Failed to install dependencies')
        this.emit('install-fail')
        return false
      case 'installed':
        Log.info('Dependencies already installed')
        return true
      default:
        this.emit('install-fail')
        return false
    }
  }

  private async _installNecessaryDeps(): Promise<DepsInstallResult> {
    try {
      await this._updateLocalPackageJson()

      const { stdout, failed } = (await this._npmInstall()) || { stdout: '', failed: true }

      // recover package.json
      fs.copyFileSync(this._packageJsonBakPath, this._packageJsonPath)
      fs.unlinkSync(this._packageJsonBakPath)

      if (stdout && !failed) {
        if (stdout.includes('up to date')) return 'installed'

        // write cache to dest
        this._writeInstallResultToCache()

        return 'success'
      }

      return 'fail'
    } catch (e) {
      return 'fail'
    }
  }

  get packageJson() {
    return fs.readJsonSync(this._packageJsonPath)
  }

  private async _npmInstall() {
    Log.info(`Install Dependencies: ${JSON.stringify(this.packageJson.dependencies)}`)
    Log.info(`Install DevDependencies: ${JSON.stringify(this.packageJson.devDependencies)}`)

    try {
      const res = await execa('npm', ['install'], {
        cwd: this.cwd,
        stdio: 'pipe',
      })

      if (res.stderr) {
        Log.error(`Npm install error: ${res.stderr}`)
      }

      return res
    } catch (e) {
      Log.error(`Npm install error: ${e}`)

      const res = await vscode.window.showErrorMessage('Dependencies install failed. Please try again', 'Retry')

      if (res === 'Retry') {
        return this._npmInstall()
      }

      return null
    }
  }

  private async _checkNpmInstalled() {
    try {
      const { stdout } = await execa('npm', ['-v'])
      Log.info(`Npm version: ${stdout}`)
      if (stdout) return true
    } catch {
      return false
    }
  }

  private async _writeInstallResultToCache() {
    const cache = await fs.readJson(this._cachePath)
    cache.installed = true
    await fs.writeJson(this._cachePath, cache, {
      encoding: 'utf-8',
      spaces: 2,
    })
    Log.info(`Write install result to cache: ${JSON.stringify(cache)}`)
  }

  private async _isDepsInstalled() {
    if (Context.instance.isDevMode) return true

    const cache = await fs.readJson(this._cachePath)

    if (cache.installed) return true

    return !!cache.installed
  }

  private async _updateLocalPackageJson() {
    if (fs.existsSync(this._packageJsonPath)) {
      await fs.copyFile(this._packageJsonPath, this._packageJsonBakPath)
    }

    const pkgJson = await fs.readJson(this._packageJsonPath)

    const extraDeps = ['sharp']

    if (pkgJson) {
      extraDeps.forEach((dep) => {
        pkgJson.dependencies[dep] = pkgJson.devDependencies[dep]
      })

      pkgJson.devDependencies = {}

      await fs.writeJson(path.join(this.cwd, './package.json'), pkgJson)
    }
  }
}
