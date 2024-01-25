import { os } from 'un-detector'

const mod = os.isMac() ? '⌘' : 'Ctrl+'
const shift = os.isMac() ? '⇧' : 'Shift+'

export const Keybinding = {
  Copy: `${mod}C`,
  Paste: `${mod}V`,
  Search: `${mod}F`,
  Undo: `${mod}Z`,
  Redo: `${mod}${shift}Z`,
}
