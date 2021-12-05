const path = require('path');

module.exports = {
  // build: {
  //   lib: {
  //     entry: path.resolve(__dirname, 'src/index.ts'),
  //     formats: ['es'],
  //     fileName: () => 'index.js',
  //     name: 'webbit'
  //   }
  // }
  build: {
    rollupOptions: {
      input: {
        'index': path.resolve(__dirname, 'sample/index.html'),
        'gamepad': path.resolve(__dirname, 'gamepad/index.html'),
      }
    }
  }
}