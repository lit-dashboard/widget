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
  'input[type=number]': {
    properties: {
      value: { type: 'Number', primary: true, changeEvent: 'change' },
      min: { type: 'Number', reflect: true },
      max: { type: 'Number', reflect: true },
      step: { type: 'Number', reflect: true },
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
