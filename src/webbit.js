import { LitElement } from 'lit-element';
import isPlainObject from './isplainobject';

import { 
  hasSourceManager,
  getSourceManager,
  getSourceProvider,
  sourceProviderAdded
} from '@webbitjs/store';

export default class Webbit extends LitElement {

  constructor() {
    super();

    for (let name in this.constructor.properties) {
      const property = this.constructor.properties[name];
      if (['sourceProvider', 'sourceKey', 'webbitId'].includes(name)) {
        continue;
      }

      const { type, attribute, reflect, structure } = property;

      if (attribute === false || !reflect) {
        continue;
      }

      Object.defineProperty(this, name, {
        get() {
          const getter = this.constructor.properties[name].get;
          if (typeof getter === 'function') {
            return getter.bind(this)();
          }
          return this[`_${name}`];
        },
        set(value) {
          const sourceProvider = getSourceProvider(this.sourceProvider);

          if (isPlainObject(value) && value.__fromSource__) {
            const oldValue = this._value;
            this[`_${name}`] = value.__value__;
            this.requestUpdate(name, oldValue);
            this._dispatchPropertyChange(name, oldValue, value.__value__);
            return;
          } else if (typeof this.sourceKey === 'string' && sourceProvider) {
            const source = this.sourceManager.getRawSource(this.sourceKey);
            if (source) {
              const propSource = source.__sources__[name];

              if (typeof propSource === 'undefined') {
                if (this.constructor.properties[name].primary && source.__fromProvider__) {
                  sourceProvider.updateFromDashboard(this.sourceKey, value);
                  return;
                }
              } else if (propSource.__fromProvider__) {
                sourceProvider.updateFromDashboard(propSource.__key__, value);
                return;
              }
            }
          }

          const oldValue = this._value;
          this[`_${name}`] = value;
          this.requestUpdate(name, oldValue);
          this._dispatchPropertyChange(name, oldValue, value);
        }
      });
    }

    Object.defineProperty(this, 'sourceProvider', {
      get() {
        return this._sourceProvider;
      },      
      set(value) {
        const oldValue = this._sourceProvider;
        this._sourceProvider = value;
        this.requestUpdate('sourceProvider', oldValue);
        this._dispatchSourceProviderChange();

        if (hasSourceManager(value)) { 
          this.sourceManager = getSourceManager(value);
          this._subscribeToSource();
        }
      }
    });

    Object.defineProperty(this, 'sourceKey', {
      get() {
        return this._sourceKey;
      },
      set(value) {
        const oldValue = this._sourceKey;
        this._sourceKey = value;
        this.requestUpdate('sourceKey', oldValue);
        this._dispatchSourceKeyChange();
        this._subscribeToSource();
      }
    });

    this.sourceProvider = null;
    this.sourceManager = null;
    this.sourceKey = null;
    this._unsubscribeSource = null;
    this._addToRegistry();

    const resizeObserver = new ResizeObserver(() => {
      this.resized();
    });
    resizeObserver.observe(this);

    sourceProviderAdded(providerName => {
      if (providerName === this.sourceProvider) {
        this.sourceManager = getSourceManager(providerName);
        this._subscribeToSource();
      }
    });
  }

  _subscribeToSource() {
    if (this._unsubscribeSource) {
      this._unsubscribeSource();
    }

    if (this.sourceKey && this.sourceManager) {
      this._unsubscribeSource = this.sourceManager.subscribe(this.sourceKey, source => {
        if (typeof source !== 'undefined') {
          this._setPropsFromSource(source);
        }
      }, true);
    }
  }

  async _addToRegistry() {
    await this.updateComplete;
    const webbitId = this.getAttribute('webbit-id');
    window.webbitRegistry._created(webbitId, this);
  }

  _dispatchSourceKeyChange() {
    const event = new CustomEvent('source-key-change', {
      detail: {
        sourceKey: this.sourceKey
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  _dispatchPropertyChange(property, oldValue, newValue) {
    const event = new CustomEvent('property-change', {
      detail: {
        property,
        oldValue,
        newValue
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  _dispatchSourceProviderChange() {
    const event = new CustomEvent('source-provider-change', {
      detail: {
        sourceProvider: this.sourceProvider
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  _dispatchSourceAdded() {
    const webbitId = this.getAttribute('webbit-id');
    const event = new CustomEvent('source-add', {
      detail: {
        webbitId
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  _setPropsFromSource(source) {

    for (let name in this.constructor.properties) {
      const property = this.constructor.properties[name];
      if (['sourceProvider', 'sourceKey', 'webbitId'].includes(name)) {
        continue;
      }

      const { type, attribute, reflect, structure, primary } = property;

      if (attribute === false || !reflect) {
        continue;
      }

      const propSource = source[name];

      if (typeof propSource === 'undefined') {
        if (primary) {
          this[name] = {
            __fromSource__: true,
            __value__: source
          }
        }
      } else {
        this[name] = {
          __fromSource__: true,
          __value__: propSource
        }
      }
    };
  }

  
  hasSource() {
    return typeof this.sourceKey !== 'null' && typeof this.sourceKey !== 'undefined';
  }

  resized() {}
}
