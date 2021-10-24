
export default {
  'input[type=checkbox]': {
    properties: {
      value: { type: 'String', defaultValue: 'on' },
      name: { type: 'String' },
      checked: { type: 'Boolean', primary: true },
      indeterminate: { type: 'Boolean', attribute: false },
      disabled: { type: 'Boolean' },
      required: { type: 'Boolean' },
      title: { type: 'String' }
    }
  }
};