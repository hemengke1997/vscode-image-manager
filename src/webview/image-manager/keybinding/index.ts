// mod (which listens for ctrl on Windows/Linux and cmd on macOS)

import { OS } from '../utils/device'

interface SymbolTypes {
  mod: string
  shift: string
  delete_str: string
  enter: string
  backspace: string
  f2: string
}

const symbols: Record<string, SymbolTypes> = {
  mac: {
    mod: '⌘',
    shift: '⇧',
    delete_str: '⌫',
    enter: '⏎',
    backspace: '⌫',
    f2: 'F2',
  },
  other: {
    mod: 'Ctrl+',
    shift: 'Shift+',
    delete_str: 'Delete',
    enter: 'Enter',
    backspace: 'Backspace',
    f2: 'F2',
  },
}

class Symbol {
  private static getSymbol(key: keyof SymbolTypes) {
    return OS.isMac ? symbols.mac[key] : symbols.other[key]
  }

  static get mod() {
    return this.getSymbol('mod')
  }

  static get shift() {
    return this.getSymbol('shift')
  }

  static get delete_str() {
    return this.getSymbol('delete_str')
  }

  static get enter() {
    return this.getSymbol('enter')
  }

  static get backspace() {
    return this.getSymbol('backspace')
  }

  static get f2() {
    return this.getSymbol('f2')
  }
}

export const Keybinding = {
  Copy: () => `${Symbol.mod}C`,
  Paste: () => `${Symbol.mod}V`,
  Cut: () => `${Symbol.mod}X`,
  Search: () => `${Symbol.mod}F`,
  Undo: () => `${Symbol.mod}Z`,
  Redo: () => `${Symbol.mod}${Symbol.shift}Z`,
  Delete: () => (OS.isMac ? `${Symbol.mod}${Symbol.delete_str}` : Symbol.delete_str),
  Enter: () => Symbol.enter,
  Rename: () => (OS.isMac ? Symbol.enter : Symbol.f2),
}
