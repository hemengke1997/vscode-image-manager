import { type Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

export default {
  content: ['./src/webview/**/*.{ts,tsx}'],
  // @see https://tailwindcss.com/docs/dark-mode#customizing-the-class-name
  // You can customize the dark mode selector
  // by setting darkMode to an array with your custom selector as the second item:
  darkMode: ['selector', '[data-theme="dark"]'],
  corePlugins: {
    preflight: false,
  },
  presets: [require('tailwind-antd-preset')],
  plugins: [
    require('./tailwind-vscode.js'),
    plugin(({ addUtilities }) => {
      addUtilities({
        '.text-xxs': {
          fontSize: '0.625rem',
        },
      })
    }),
  ],
} as Config
