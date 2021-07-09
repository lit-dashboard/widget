import { normalizeConfig } from './element-config';
import Store from '@webbitjs/store/src';

// let store = new Store();
// store

class WebbitConnector {

  constructor(store, elementConfigs = []) {
    this.store = store;
    this.elementConfigs = new Map();
    elementConfigs.forEach(config => {
      this.elementConfigs.set(config.name, normalizeConfig(config));
    });
    this.elements = new Map();

    this.store.defaultSourceProviderSet(sourceProvider => {
      this.elements.forEach((elementObject, element) => {
        if (elementObject.sourceProvider === null) {
          this.setSourceProvider(element, sourceProvider);
        }
      });
    });
  }

  connect(element) {

  }

  connectChildren(element) {

  }

  getElementConfig(name) {
    return this.elementConfigs.get(name);
  }

  hasElementConfig(name) {
    return this.elementConfigs.has(name);
  }

  setDefaultPropertyValue(element, property, value) {
    const elementObject = this.getElement(element);

    if (elementObject) {
      elementObject.defaultPropertyValues[property] = value;
    }
  }

  setSourceProvider(element, sourceProvider) {
    const elementObject = this.getElement(element);

    if (elementObject) {
      element.setAttribute('source-provider', sourceProvider);
    }
  }

  setSourceKey(element, sourceKey) {
    const elementObject = this.getElement(element);

    if (elementObject) {
      element.setAttribute('source-key', sourceKey);
    }
  }

  getDefaultPropertyValue(element, property) {
    const elementObject = this.getElement(element);
    return elementObject
      ? elementObject.defaultPropertyValues[property]
      : null;
  }

  getDefaultPropertyValues(element) {
    const elementObject = this.getElement(element);
    return elementObject ? elementObject.defaultPropertyValues : {};
  }

  getSourceProvider(element) {
    const elementObject = this.getElement(element);
    return elementObject ? elementObject.sourceProvider : this.store.getDefaultSourceProvider();
  }

  getSourceKey(element) {
    const elementObject = this.getElement(element);
    return elementObject ? elementObject.sourceKey : null;
  }

  getElement(element) {
    return this.elements.get(element);
  }

  hasElement(element) {
    return this.elements.has(element);
  }
}

export default WebbitConnector;