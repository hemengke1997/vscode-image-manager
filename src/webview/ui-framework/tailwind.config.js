const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/webview/**/*.tsx'],
  // @see https://tailwindcss.com/docs/dark-mode#customizing-the-class-name
  // You can customize the dark mode selector name
  // by setting darkMode to an array with your custom selector as the **second** item:
  darkMode: ['class', '[data-theme="dark"]'],
  corePlugins: {
    preflight: false,
  },
  presets: [require('tailwind-antd-preset')],
  plugins: [
    require('./tailwind-vscode.js'),
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.text-xxs': {
          fontSize: '0.625rem',
        },
      })
    }),
  ],
}
