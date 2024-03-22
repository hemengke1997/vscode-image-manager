import { window } from 'vscode'

export class VscodeTheme {
  /**
   * vscode theme
   */
  static vscodeTheme: Theme

  static init() {
    switch (window.activeColorTheme.kind) {
      case 1:
        this.vscodeTheme = 'light'
        break
      case 2:
        this.vscodeTheme = 'dark'
        break
      default:
        this.vscodeTheme = 'dark'
        break
    }
  }
}
