import Store, { Source } from '@webbitjs/store';
import { normalizeConfig, WebbitConfig, WebbitProperty } from './element-config';
import { isEqual, getValueType, noop } from './util';
import PropertyHandler from './property-handler';
import { prop2PropValue } from './value-converters/convert-to-type';

type PropertyConfig = WebbitProperty & {
  name: string,
}

type SourceChangeObserver = {
  connect: () => void;
  disconnect: () => void;
};

class Webbit {
  readonly #element: HTMLElement;
  readonly #store: Store;
  readonly #config: WebbitConfig;
  readonly #propertyHandlers: Map<string, PropertyHandler>;
  readonly #primaryPropertyConfig?: PropertyConfig;
  readonly #primaryPropertyHandler?: PropertyHandler;
  #connected = false;
  #sourceChangeObserver: SourceChangeObserver;
  #defaultPropertyValues: Record<string, unknown> = {};
  #unsubscribe: () => void = noop;

  get sourceProvider(): string | undefined {
    return this.#element.getAttribute('source-provider') ?? undefined;
  }

  set sourceProvider(provider: string | undefined) {
    if (typeof provider !== 'undefined') {
      this.#element.setAttribute('source-provider', provider);
    } else {
      this.#element.removeAttribute('source-provider');
    }
  }

  get sourceKey(): string | undefined {
    return this.#element.getAttribute('source-key') ?? undefined;
  }

  set sourceKey(key: string | undefined) {
    if (typeof key !== 'undefined') {
      this.#element.setAttribute('source-key', key);
    } else {
      this.#element.removeAttribute('source-key');
    }
  }

  get source(): Source | undefined {
    if (typeof this.sourceProvider !== 'undefined' && typeof this.sourceKey !== 'undefined') {
      return this.#store.getSource(this.sourceProvider, this.sourceKey);
    }
    return undefined;
  }

  get hasSource(): boolean {
    return typeof this.source !== 'undefined';
  }

  constructor(element: HTMLElement, store: Store, config: WebbitConfig) {
    this.#element = element;
    this.#store = store;
    this.#config = normalizeConfig(config || {
      name: element.tagName.toLowerCase(),
    });
    const properties: PropertyConfig[] = Object.entries(this.#config.properties)
      .map(([name, property]) => ({ ...property, name }));
    this.#propertyHandlers = new Map(
      properties.map(property => {
        const handler = new PropertyHandler(this.#element, property);
        handler.subscribe(value => {
          this.#onPropertyUpdate(property, value);
        });
        return [property.name, handler];
      }),
    );
    this.#primaryPropertyConfig = properties.find(({ primary }) => primary);
    this.#primaryPropertyHandler = this.#primaryPropertyConfig
      ? this.#propertyHandlers.get(this.#primaryPropertyConfig.name)
      : undefined;
    this.#sourceChangeObserver = this.#getSourceChangeObserver();

    this.#store.defaultSourceProviderSet(sourceProvider => {
      if (this.sourceProvider === null) {
        this.sourceProvider = sourceProvider;
      }
    });

    this.connect();
  }

  #getSourceChangeObserver(): SourceChangeObserver {
    const observer = new MutationObserver(() => {
      this.#updateSubscription();
    });

    return {
      connect: () => {
        observer.observe(this.#element, {
          attributes: true,
          attributeFilter: ['source-provider', 'source-key'],
        });
      },
      disconnect: () => {
        observer.disconnect();
      },
    };
  }

  connect(): void {
    this.#connected = true;
    this.#sourceChangeObserver.connect();
    this.#updateSubscription();
  }

  disconnect(): void {
    this.#connected = false;
    this.#sourceChangeObserver.disconnect();
    this.#updateSubscription();
  }

  setDefaultPropertyValue(property: string, value: unknown): void {
    this.#defaultPropertyValues[property] = value;
  }

  getDefaultPropertyValue(property: string): unknown {
    return this.#defaultPropertyValues[property];
  }

  getDefaultPropertyValues(): Record<string, unknown> {
    return this.#defaultPropertyValues;
  }

  #updateSubscription(): void {
    if (!this.#connected) {
      this.#unsubscribe();
      this.#unsubscribe = noop;
      this.#propertyHandlers.forEach(handler => handler.disconnect());
      return;
    }

    if (!this.sourceKey) {
      this.sourceKey = this.#config.defaultSourceKey;
    }

    if (!this.sourceProvider) {
      this.sourceProvider = (
        this.#config.defaultSourceProvider || this.#store.getDefaultSourceProvider()
      );
    }

    if (!this.sourceKey || !this.sourceProvider) {
      this.#unsubscribe();
      this.#unsubscribe = noop;
      this.#propertyHandlers.forEach(handler => handler.disconnect());
    } else {
      this.#unsubscribe();
      this.#propertyHandlers.forEach(handler => {
        handler.disconnect();
      });
      this.#unsubscribe = this.#store.subscribe(
        this.sourceProvider,
        this.sourceKey,
        (sourceValue, parentKey, sourceKey) => {
          this.#subscriber(parentKey, sourceKey);
        },
        true,
      );
    }
  }

  #subscriber(parentKey: string, sourceKey: string): void {
    if (typeof this.source === 'undefined') {
      // source has been removed, so set attributes to defaults
      this.#propertyHandlers.forEach(handler => {
        handler.disconnect();
      });
    } else if (this.source.hasChildren()) {
      const children = this.source.getChildren();
      // if parentKey and key are equal, map all props to attributes
      if (parentKey === sourceKey) {
        Object.getOwnPropertyNames(children).forEach(prop => {
          if (this.#propertyHandlers.has(prop)) {
            this.#propertyHandlers.get(prop)?.update(children[prop].getSourceValue());
          }
        });
      } else {
        const prop = sourceKey.replace(`${parentKey}/`, '');

        if (this.#propertyHandlers.has(prop)) {
          const handler = this.#propertyHandlers.get(prop);
          const value = children[prop].getSourceValue();
          if (typeof value === 'undefined') {
            handler?.disconnect();
          } else {
            handler?.update(value);
          }
        }
      }
    } else if (this.#primaryPropertyHandler) {
      this.#primaryPropertyHandler.update(this.source.getSourceValue());
    }
  }

  #onPropertyUpdate({ name, primary }: { name: string, primary: boolean }, value: unknown): void {
    const { source, sourceProvider, sourceKey } = this;
    if (typeof sourceProvider === 'undefined' || typeof source === 'undefined' || typeof sourceKey === 'undefined') {
      return;
    }
    const provider = this.#store.getSourceProvider(sourceProvider);
    const propType = getValueType(value);
    const children = source.getChildren();

    if (!source.hasChildren()) {
      if (primary) {
        if (value === null) {
          if (source !== null) {
            provider.userUpdate(sourceKey, value);
          }
        } else {
          const newSourceValueType = getValueType(source) || propType;
          const newSourceValue = prop2PropValue(value, newSourceValueType);
          const newSourceBackToPropValue = prop2PropValue(newSourceValue, propType);
          if (
            isEqual(value, newSourceBackToPropValue)
            && !isEqual(source, newSourceValue)
          ) {
            provider.userUpdate(sourceKey, newSourceValue);
          }
        }
      }
    } else if (value === null) {
      if (children[name].getSourceValue() !== null) {
        children[name].setSourceValue(value);
      }
    } else {
      const newSourceValueType = getValueType(children[name]) || propType;
      const newSourceValue = prop2PropValue(value, newSourceValueType);
      const newSourceBackToPropValue = prop2PropValue(newSourceValue, propType);
      if (
        isEqual(value, newSourceBackToPropValue)
        && !isEqual(children[name], newSourceValue)
      ) {
        children[name].setSourceValue(newSourceValue);
      }
    }
  }
}

export default Webbit;