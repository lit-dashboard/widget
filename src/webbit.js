import { LitElement } from 'lit-element';
import isPlainObject from './isplainobject';

import { 
  hasSourceProvider,
  getSourceProvider,
  sourceProviderAdded,
  getDefaultSourceProvider,
  defaultSourceProviderSet
} from '@webbitjs/store';

export default class Webbit extends LitElement {

  constructor() {
    super();
    console.log("???");

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
            const oldValue = this[`_${name}`];
            this[`_${name}`] = value.__value__;
            this.requestUpdate(name, oldValue);
            this._dispatchPropertyChange(name, oldValue, value.__value__);
            return;
          } else if (typeof this.sourceKey === 'string' && sourceProvider) {
            const source = sourceProvider.getRawSource(this.sourceKey);
            if (source) {
              const propSource = source.__sources__[name];

              if (typeof propSource === 'undefined') {
                if (this.constructor.properties[name].primary && source.__fromProvider__) {
                  sourceProvider.userUpdate(this.sourceKey, value);
                  return;
                }
              } else if (propSource.__fromProvider__) {
                sourceProvider.userUpdate(propSource.__key__, value);
                return;
              }
            }
          }

          const oldValue = this[`_${name}`];
          this[`_${name}`] = value;
          this.requestUpdate(name, oldValue);
          this._dispatchPropertyChange(name, oldValue, value);
        }
      });
    }

    Object.defineProperty(this, 'sourceProvider', {
      get() {
        return this._sourceProvider || getDefaultSourceProvider();
      },      
      set(value) {
        const oldValue = this._sourceProvider;
        this._sourceProvider = value;
        this.requestUpdate('sourceProvider', oldValue);
        this._dispatchSourceProviderChange();

        if (hasSourceProvider(value)) { 
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
    this.sourceKey = null;
    this._unsubscribeSource = null;
    this._addToRegistry();

    const resizeObserver = new ResizeObserver(() => {
      this.resized();
    });
    resizeObserver.observe(this);

    sourceProviderAdded(providerName => {
      if (providerName === this.sourceProvider) {
        this._subscribeToSource();
      }
    });

    defaultSourceProviderSet(defaultSourceProvider => {
      if (!this.sourceProvider) {
        this.sourceProvider = defaultSourceProvider;
      }
      this._subscribeToSource();
    });
  }

  _subscribeToSource() {

    console.log('_subscribeToSource called 1');

    if (this._unsubscribeSource) {
      this._unsubscribeSource();
    }

    console.log('_subscribeToSource called 2');

    const sourceProvider = getSourceProvider(this.sourceProvider);

    console.log('_subscribeToSource called 3', sourceProvider);


    if (this.sourceKey && sourceProvider) {
      console.log("SUBSCRIBE:", this.sourceKey);
      this._unsubscribeSource = sourceProvider.subscribe(this.sourceKey, source => {
        console.log("value:", this.sourceKey, source);
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
