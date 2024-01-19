import {
  blue,
  cyan,
  geekblue,
  gold,
  green,
  grey,
  lime,
  magenta,
  purple,
  red,
  volcano,
  yellow,
} from '@ant-design/colors'

export type ThemeType = 'dark' | 'light'

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') as ThemeType
}

export function switchTheme(theme: ThemeType) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function getCssVar(target: string, container = document.documentElement) {
  return getComputedStyle(container).getPropertyValue(target)
}

export const builtInColors = [blue, cyan, geekblue, gold, green, grey, lime, magenta, purple, red, volcano, yellow] as {
  primary: string
}[]

export const vscodeColors = [getCssVar('--vscode-activityBarBadge-background'), getCssVar('--vscode-button-background')]
