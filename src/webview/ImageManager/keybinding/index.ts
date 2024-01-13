import { os } from 'un-detector'

const mod = os.isMac() ? '⌘' : 'Ctrl+'

export const Keybinding = {
  Copy: `${mod}C`,
  Paste: `${mod}V`,
  Search: `${mod}F`,
}
