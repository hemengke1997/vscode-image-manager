const path = require('pathe')

module.exports = {
  plugins: [
    require('tailwindcss/nesting'),
    require('tailwindcss')({ config: path.resolve(__dirname, './tailwind.config.cjs') }),
  ],
}
