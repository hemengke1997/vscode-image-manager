import { os } from 'un-detector'

// mod (which listens for ctrl on Windows/Linux and cmd on macOS)

type SymbolTypes = {
  mod: string
  shift: string
  delete_str: string
  enter: string
  backspace: string
}

const symbols: Record<string, SymbolTypes> = {
  mac: {
    mod: '⌘',
    shift: '⇧',
    delete_str: '⌫',
    enter: '⏎',
    backspace: '⌫',
  },
  other: {
    mod: 'Ctrl+',
    shift: 'Shift+',
    delete_str: 'Delete',
    enter: 'Enter',
    backspace: 'Backspace',
  },
}

class Symbol {
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
  private static getSymbol(key: keyof SymbolTypes) {
    return os.isMac() ? symbols.mac[key] : symbols.other[key]
  }
}

export const Keybinding = {
  Copy: `${Symbol.mod}C`,
  Paste: `${Symbol.mod}V`,
  Search: `${Symbol.mod}F`,
  Undo: `${Symbol.mod}Z`,
  Redo: `${Symbol.mod}${Symbol.shift}Z`,
  Delete: `${Symbol.mod}${Symbol.backspace}`,
  Enter: Symbol.enter,
}
