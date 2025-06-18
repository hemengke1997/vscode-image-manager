import antfu from '@antfu/eslint-config'
import tailwind from 'eslint-plugin-tailwindcss'

export default antfu(
  {
    react: true,
    ignores: ['dist-webview'],
    rules: {
      'react-hooks/exhaustive-deps': 'off',
      'react/no-array-index-key': 'off',
      'react-hooks-extra/no-direct-set-state-in-use-effect': 'off',
      'react-dom/no-dangerously-set-innerhtml': 'off',
      'ts/no-require-imports': 'off',
      'no-async-promise-executor': 'off',
      'style/jsx-quotes': ['error', 'prefer-single'],
      'style/quote-props': ['error', 'consistent'],
    },
    stylistic: {
      quotes: 'single',
    },
    formatters: {
      css: true,
      markdown: 'prettier',
    },
  },
  [
    ...tailwind.configs['flat/recommended'],
    {
      rules: {
        'tailwindcss/no-custom-classname': 'off',
      },
    },
  ],
)
