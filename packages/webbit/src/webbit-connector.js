import { normalizeConfig } from './element-config';
import Webbit from './webbit';

class WebbitConnector {

  constructor(store, elementConfigs = {}) {
    this.store = store;
    this.elementConfigs = new Map();
    Object.entries(elementConfigs).forEach((name, config) => {
      this.elementConfigs.set(name, normalizeConfig(config));
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
    const elementConfig = this.getElementConfig(element.tagName.toLowerCase());
    if (this.hasElement(element) || !elementConfig) {
      return;
    }
    const webbit = new Webbit(element, this.store, elementConfig);
    this.elements.set(element, webbit);
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
    const webbit = this.getElementWebbit(element);

    if (webbit) {
      webbit.defaultPropertyValues[property] = value;
    }
  }

  setSourceProvider(element, sourceProvider) {
    const webbit = this.getElementWebbit(element);

    if (webbit) {
      webbit.sourceProvider = sourceProvider;
    }
  }

  setSourceKey(element, sourceKey) {
    const webbit = this.getElementWebbit(element);

    if (webbit) {
      webbit.sourceKey = sourceKey;
    }
  }

  getDefaultPropertyValue(element, property) {
    const webbit = this.getElementWebbit(element);
    return webbit
      ? webbit.defaultPropertyValues[property]
      : null;
  }

  getDefaultPropertyValues(element) {
    const webbit = this.getElementWebbit(element);
    return webbit ? webbit.defaultPropertyValues : {};
  }

  getSourceProvider(element) {
    const webbit = this.getElementWebbit(element);
    return webbit ? webbit.sourceProvider : this.store.getDefaultSourceProvider();
  }

  getSourceKey(element) {
    const webbit = this.getElementWebbit(element);
    return webbit ? webbit.sourceKey : null;
  }

  getElementWebbit(element) {
    return this.elements.get(element);
  }

  hasElement(element) {
    return this.elements.has(element);
  }
}

export default WebbitConnector;