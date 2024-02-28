const path = require('node:path')

module.exports = {
  plugins: [
    require('tailwindcss/nesting'),
    require('tailwindcss')({ config: path.resolve(__dirname, './tailwind.config.js') }),
  ],
}
