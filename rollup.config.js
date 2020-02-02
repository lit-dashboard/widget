import resolve from '@rollup/plugin-node-resolve';

export default {
  output: {
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