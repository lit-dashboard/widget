import { normalizeConfig } from './element-config';
import Webbit from './webbit';
import Store from '@webbitjs/store';
import { getWebbitTreeWalker, getWebbitIterator, filterNode } from './filter';

class WebbitConnector {

  readonly #store: Store;
  readonly #elementConfigs = new Map<string, object>();
  readonly #elements = new Map<HTMLElement, Webbit>();
  readonly #rootElement: HTMLElement;

  constructor(rootElement: HTMLElement, store: Store, elementConfigs: object[] = []) {
    this.#store = store;
    Object.entries(elementConfigs).forEach(([selector, config]) => {
      this.#elementConfigs.set(selector, normalizeConfig(config));
    });
    this.#store.defaultSourceProviderSet((sourceProvider: string) => {
      this.#elements.forEach((elementObject, element) => {
        if (elementObject.sourceProvider === null) {
          this.setSourceProvider(element, sourceProvider);
        }
      });
    });
    this.#rootElement = rootElement;
    this.#connectChildren();
  }

  #connect(element: HTMLElement) {
    const elementConfig = this.getMatchingElementConfig(element);
    if (this.hasElement(element) || !elementConfig) {
      return;
    }
    const webbit = new Webbit(element, this.#store, elementConfig);
    this.#elements.set(element, webbit);
  }

  #disconnect(element: HTMLElement) {
    const elementWebbit = this.getElementWebbit(element);
    if (elementWebbit) {
      elementWebbit.disconnect();
      this.#elements.delete(element);
    }
  }

  #connectChildren() {
    const iterator = this.#getWebbitIterator(this.#rootElement);
    while (iterator.nextNode()) {
      this.#connect(iterator.referenceNode as HTMLElement);
    }

    const observer = new MutationObserver(mutations => {
      for (let mutation of mutations) {
        if (mutation.type === 'childList') {
          const addedNodes = mutation.addedNodes || [];
          const removedNodes = mutation.removedNodes || [];
          addedNodes.forEach(node => {
            if (node instanceof HTMLElement) {
              if (this.#isWebbit(node)) {
                this.#connect(node);
              }
              const iterator = this.#getWebbitIterator(node as HTMLElement);
              while (iterator.nextNode()) {
                this.#connect(iterator.referenceNode as HTMLElement);
              }
            }
          });
          removedNodes.forEach(node => {
            this.#disconnect(node as HTMLElement);
            for (let element of this.#elements.keys())
            if (node.contains(element)) {
              this.#disconnect(element);
            }
          });
        } else if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
          if (this.#isWebbit(mutation.target)) {
            this.#connect(mutation.target);
          }
        }
      }
    });

    observer.observe(this.#rootElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['source-key', 'source-provider']
    });
  }

  #getWebbitIterator(element: HTMLElement) {
    return getWebbitIterator(element, this.getStore().getDefaultSourceProvider(), this.#elementConfigs);
  }

  #isWebbit(element: HTMLElement) {
    return filterNode(element, this.#store.getDefaultSourceProvider(), this.#elementConfigs) === NodeFilter.FILTER_ACCEPT;
  }

  getMatchingElementConfig(element: HTMLElement) {
    const entry = [...this.#elementConfigs.entries()]
      .find(([selector]) => element.matches(selector));
    return entry?.[1] ?? null;
  }

  getElementConfig(selector: string) {
    return this.#elementConfigs.get(selector);
  }

  hasElementConfig(selector: string) {
    return this.#elementConfigs.has(selector);
  }

  setDefaultPropertyValue(element: HTMLElement, property: string, value: any) {
    const webbit = this.getElementWebbit(element);

    if (webbit) {
      webbit.defaultPropertyValues[property] = value;
    }
  }

  setSourceProvider(element: HTMLElement, sourceProvider: string) {
    const webbit = this.getElementWebbit(element);

    if (webbit) {
      webbit.sourceProvider = sourceProvider;
    }
  }

  setSourceKey(element: HTMLElement, sourceKey: string) {
    const webbit = this.getElementWebbit(element);

    if (webbit) {
      webbit.sourceKey = sourceKey;
    }
  }

  getDefaultPropertyValue(element: HTMLElement, property: string) {
    const webbit = this.getElementWebbit(element);
    return webbit
      ? webbit.defaultPropertyValues[property]
      : null;
  }

  getDefaultPropertyValues(element: HTMLElement) {
    const webbit = this.getElementWebbit(element);
    return webbit ? webbit.defaultPropertyValues : {};
  }

  getSourceProvider(element: HTMLElement) {
    const webbit = this.getElementWebbit(element);
    return webbit ? webbit.sourceProvider : this.#store.getDefaultSourceProvider();
  }

  getSourceKey(element: HTMLElement) {
    const webbit = this.getElementWebbit(element);
    return webbit ? webbit.sourceKey : null;
  }

  getElementWebbit(element: HTMLElement) {
    return this.#elements.get(element);
  }

  hasElement(element: HTMLElement) {
    return this.#elements.has(element);
  }

  getStore() {
    return this.#store;
  }
}

export default WebbitConnector;