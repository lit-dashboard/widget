const path = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'MyLib',
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['lit'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          lit: 'Lit'
        }
      }
    }
  }
})