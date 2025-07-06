import { atomWithStorage } from 'jotai/utils'

export const DebugAtoms = {
  isDebugModeAtom: atomWithStorage<boolean>('debug-mode', false),
}
