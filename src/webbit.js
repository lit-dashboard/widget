import { normalizeConfig } from './element-config';
import { isSourceObject } from './util';
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

  constructor(element, store, config) {
    this.element = element;
    this.store = store;
    this.config = normalizeConfig(config || {
      name: element.tagName.toLowerCase()
    });
    this.propertyHandlers = new Map(this.config.properties.map(property => (
      [property.name, new PropertyHandler(this.element, property)]
    )));
    const primaryPropertyConfig = this.config.properties.find(({ primary }) => primary);
    this.primaryPropertyHandler = primaryPropertyConfig
      ? this.propertyHandlers.get(primaryPropertyConfig.name)
      : null;
    this._connected = false;
    this._sourceChangeObserver = this._getSourceChangeObserver();
    this._propertyChangeObserver = this._getPropertyChangeObserver();
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

  _getPropertyChangeObserver() {
    return {
      connect: () => {
        this.propertyHandlers.forEach(handler => handler.connect());
      },
      disconnect: () => {
        this.propertyHandlers.forEach(handler => handler.disconnect());
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
      this._propertyChangeObserver.disconnect();
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
      this._propertyChangeObserver.disconnect();
    } else {
      this._unsubscribe = this.store.subscribe(this.sourceProvider, this.sourceKey, (source, parentKey, key) => {
        this._subscriber(source, parentKey, key);
      });
      this._propertyChangeObserver.connect();
    }
  }

  _subscriber(source, parentKey, key) {
    
    if (typeof source === 'undefined') {
      // source has been removed, so set attributes to defaults
      this.propertyHandlers.forEach(handler => {
        handler.setToDefault();
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
          this.propertyHandlers.get(prop).update(source[prop]);
        }
      }
    } else if (this.primaryPropertyHandler) {
      this.primaryPropertyHandler.update(source);
    }
  }
}

export default Webbit;