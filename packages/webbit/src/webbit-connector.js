import { normalizeConfig } from './element-config';
import Webbit from './webbit';

class WebbitConnector {

  constructor(store, elementConfigs = {}) {
    this.store = store;
    this.elementConfigs = new Map();
    Object.entries(elementConfigs).forEach(([selector, config]) => {
      this.elementConfigs.set(selector, normalizeConfig(config));
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
    const elementConfig = this.getMatchingElementConfig(element);
    if (this.hasElement(element) || !elementConfig) {
      return;
    }
    const webbit = new Webbit(element, this.store, elementConfig);
    this.elements.set(element, webbit);
  }

  disconnect(element) {
    const elementWebbit = this.getElementWebbit(element);
    if (elementWebbit) {
      elementWebbit.disconnect();
      this.elements.delete(element);
    }
  }

  connectChildren(element) {
    element.querySelectorAll('[source-key]').forEach(childNode => {
      this.connect(childNode);
    });

    this.elementConfigs.forEach(({ defaultSourceKey }, selector) => {
      if (defaultSourceKey) {
        element.querySelectorAll(selector).forEach(childNode => {
          this.connect(childNode);
        });
      }
    });

    const observer = new MutationObserver(mutations => {
      for (let mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'subtree') {
          const addedNodes = mutation.addedNodes || [];
          const removedNodes = mutation.removedNodes || [];
          addedNodes.forEach(node => {
            if ('querySelectorAll' in node) {
              const config = this.getMatchingElementConfig(node);
              const defaultSourceKey = config?.defaultSourceKey;
              if (node.hasAttribute('source-key') || defaultSourceKey) {
                this.connect(node);
              }

              node.querySelectorAll('[source-key]').forEach(childNode => {
                this.connect(childNode);
              });

              this.elementConfigs.forEach(({ defaultSourceKey }, selector) => {
                if (defaultSourceKey) {
                  node.querySelectorAll(selector).forEach(childNode => {
                    this.connect(childNode);
                  });
                }
              });
            }
          });
          removedNodes.forEach(node => {
            if ('querySelectorAll' in node) {
              if (node.hasAttribute('source-key')) {
                this.disconnect(node);
              }
              node.querySelectorAll('[source-key]').forEach(childNode => {
                this.disconnect(childNode);
              });
            }
          });
        } else if (mutation.type === 'attributes') {
          this.connect(mutation.target);
        }
      }
    });

    observer.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['source-key', 'source-provider']
    });
  }

  getMatchingElementConfig(element) {
    const entry = [...this.elementConfigs.entries()]
      .find(([selector]) => element.matches(selector));
    return entry?.[1] ?? null;
  }

  getElementConfig(selector) {
    return this.elementConfigs.get(selector);
  }

  hasElementConfig(selector) {
    return this.elementConfigs.has(selector);
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

  getStore() {
    return this.store;
  }
}

export default WebbitConnector;