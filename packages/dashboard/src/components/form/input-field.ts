/* eslint import/extensions: off */
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators/property.js';
import { customElement } from 'lit/decorators/custom-element.js';

@customElement('webbit-input-field')
export default class InputField extends LitElement {
  @property() label = '';

  static styles = css`
    :host {
      display: inline-flex;
      flex-direction: column;
    }

    label {
      font-family: sans-serif;
      font-size: 13px;
      color: #888;
      margin-bottom: 5px;
    }

    ::slotted(*) {

    }
  `;

  render(): ReturnType<typeof html> {
    return html`
      <label>${this.label}</label>
      <slot><input type="text" /></slot>
    `;
  }
}
