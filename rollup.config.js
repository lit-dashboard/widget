import resolve from '@rollup/plugin-node-resolve';

export default {
  input: './src/index.js',
  output: {
    file: './dist/webbit.js',
    format: 'umd',
    name: 'Webbit',
    globals: {
      'lodash': '_',
      '@lit-dashboard/store': 'WebbitStore'
    }
  },
  plugins: [
    resolve({
      only: ['lit-element', 'lit-html']
    })
  ]
}