import { normalizeConfig } from './element-config';
import { isSourceObject, isEqual } from './util';
import PropertyHandler from './property-handler';

class Webbit {

  get sourceProvider() {
    return this.element.getAttribute('source-provider');
  }

  get sourceKey() {
    return this.element.getAttribute('source-key');
  }

  set sourceProvider(provider) {
    if (provider) {
      this.element.setAttribute('source-provider', provider);
    }
  }

  set sourceKey(key) {
    if (key) {
      this.element.setAttribute('source-key', key);
    }
  }

  get source() {
    return this.store.getSource(this.sourceProvider, this.sourceKey);
  }

  get hasSource() {
    const rawSource = this.store.getRawSource(this.sourceProvider, this.sourceKey);
    return typeof rawSource !== 'undefined';
  }

  constructor(element, store, config) {
    this.element = element;
    this.store = store;
    this.config = normalizeConfig(config || {
      name: element.tagName.toLowerCase()
    });
    const properties = Object.entries(this.config.properties)
      .map(([name, property]) => ({ ...property, name }))
    this.propertyHandlers = new Map(
      properties.map(property => {
        const handler = new PropertyHandler(this.element, property);
        handler.subscribe(value => {
          this._onPropertyUpdate(property, value);
        });
        return [property.name, handler];
      }
    ));
    this.primaryPropertyConfig = properties.find(({ primary }) => primary);
    this.primaryPropertyHandler = this.primaryPropertyConfig
      ? this.propertyHandlers.get(this.primaryPropertyConfig.name)
      : null;
    this._connected = false;
    this._sourceChangeObserver = this._getSourceChangeObserver();
    this.defaultPropertyValues = {};
    this._unsubscribe = () => { };

    this.store.defaultSourceProviderSet(sourceProvider => {
      if (this.sourceProvider === null) {
        this.sourceProvider = sourceProvider;
      }
    });

    this.connect();
  }

  _getSourceChangeObserver() {
    const observer = new MutationObserver(() => {
      this._updateSubscription();
    });

    return {
      connect: () => {
        observer.observe(this.element, {
          attributes: true,
          attributeFilter: ['source-provider', 'source-key']
        });
      },
      disconnect: () => {
        observer.disconnect();
      },
    };
  }

  connect() {
    this._connected = true;
    this._sourceChangeObserver.connect();
    this._updateSubscription();
  }

  disconnect() {
    this._connected = false;
    this._sourceChangeObserver.disconnect();
    this._updateSubscription();
  }

  _updateSubscription() {

    if (!this._connected) {
      this._unsubscribe();
      this._unsubscribe = () => { };
      this.propertyHandlers.forEach(handler => handler.disconnect());
      return;
    }

    if (!this.sourceKey) {
      this.sourceKey = this.config.defaultSourceKey;
    }

    if (!this.sourceProvider) {
      this.sourceProvider = this.config.defaultSourceProvider || this.store.getDefaultSourceProvider();
    }

    if (!this.sourceKey || !this.sourceProvider) {
      this._unsubscribe();
      this._unsubscribe = () => { };
      this.propertyHandlers.forEach(handler => handler.disconnect());
    } else {
      this._unsubscribe();
      this.propertyHandlers.forEach(handler => {
        handler.disconnect();
      });
      this._unsubscribe = this.store.subscribe(this.sourceProvider, this.sourceKey, (source, parentKey, key) => {
        this._subscriber(source, parentKey, key);
      }, true);
    }
  }

  _subscriber(source, parentKey, key) {

    if (typeof source === 'undefined') {
      // source has been removed, so set attributes to defaults
      this.propertyHandlers.forEach(handler => {
        handler.disconnect();
      });
    } else if (isSourceObject(source)) {
      // if parentKey and key are equal, map all props to attributes
      if (parentKey === key) {
        Object.getOwnPropertyNames(source).forEach(prop => {
          if (this.propertyHandlers.has(prop)) {
            this.propertyHandlers.get(prop).update(source[prop]);
          }
        });
      } else {
        const prop = key.replace(parentKey + '/', '');

        if (this.propertyHandlers.has(prop)) {
          const handler = this.propertyHandlers.get(prop);
          const value = source[prop];
          if (typeof value === 'undefined') {
            handler.disconnect();
          } else {
            handler.update(value);
          }
        }
      }
    } else if (this.primaryPropertyHandler) {
      this.primaryPropertyHandler.update(source);
    }
  }

  _onPropertyUpdate({ name, primary }, value) {
    const source = this.source;

    if (!isSourceObject(source)) {
      if (primary && !isEqual(source, value)) {
        const provider = this.store.getSourceProvider(this.sourceProvider);
        provider.userUpdate(this.sourceKey, value);
      }
    } else if (!isEqual(source[name], value)) {
      source[name] = value;
    }
  }
}

export default Webbit;