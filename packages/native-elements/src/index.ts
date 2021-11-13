export default {
  'input[type=checkbox]': {
    properties: {
      value: { type: 'String', reflect: true, defaultValue: 'on' },
      name: { type: 'String', reflect: true },
      checked: { type: 'Boolean', changeEvent: 'change', primary: true },
      indeterminate: { type: 'Boolean', attribute: false },
      disabled: { type: 'Boolean', reflect: true },
      required: { type: 'Boolean', reflect: true },
      title: { type: 'String', reflect: true },
    },
  },
  button: {
    properties: {
      value: { type: 'String', reflect: true },
      name: { type: 'String', reflect: true },
      type: { type: 'String', reflect: true, defaultValue: 'submit' },
      disabled: { type: 'Boolean', reflect: true },
      title: { type: 'String', reflect: true },
    },
  },
};
