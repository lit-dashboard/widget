import { LitElement, html, css } from 'lit';
import './source-view';

class SourcesView extends LitElement {

  static get styles() {
    return css`
      :host {
        display: block;
        font-family: sans-serif;
      }

      p {
        margin: 8px 0 5px;
        font-weight: bold;
      }
    `;
  }

  static get properties() {
    return {
      provider: { type: String, attribute: 'provider' },
      store: { type: Object },
    };
  }

  constructor() {
    super();
    this.provider = '';
    this.store = null;
  }

  setProviders() {
    this.providers = getSourceProviderNames().map(name => {
      return getSourceProvider(name);
    });
  }

  firstUpdated() {
    this.store.sourceProviderAdded(() => {
      this.requestUpdate();
    });
    this.store.subscribeAll(this.provider, () => {
      this.requestUpdate();
    });
  }

  getLabel(name) {
    if (!name) {
      return '';
    }

    const parts = name.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart;
  }

  render() {
    const rootSource = this.store.getRawSources(this.provider);
    const sources = rootSource ? rootSource.__sources__ : {};
    const sourceEntries = Object.entries(sources);

    if (sourceEntries.length === 0) {
      return html`
        <p>No sources detected</p>
      `;
    }

    return html`
      <div>
        ${sourceEntries.map(([name, source]) => html`
        <source-view 
          ?only-child="${sourceEntries.length === 1}" 
          label="${this.getLabel(source.__key__)}"
          provider-name="${this.provider}" 
          .source="${{ ...source }}"
        >
        </source-view>
        `)}
      </div>
    `;
  }
}

customElements.define('sources-view', SourcesView);