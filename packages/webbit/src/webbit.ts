import * as PubSub from 'pubsub-js';
import Store, { Source } from '@webbitjs/store';
import { camelCase, camelCaseTransformMerge } from 'camel-case';
import { normalizeConfig, WebbitConfig, WebbitProperty } from './element-config';
import { isEqual, getValueType, noop } from './util';
import PropertyHandler from './property-handler';
import { prop2PropValue } from './value-converters/convert-to-type';

function formatProp(propName: string): string {
  return camelCase(propName, { transform: camelCaseTransformMerge });
}

function getChildWithName(
  children: Record<string, Source>,
  propName: string,
): { name: string, source: Source } | undefined {
  const childEntries = Object.entries(children);
  const childEntry = childEntries.find(([childName]) => formatProp(childName) === propName);
  if (!childEntry) {
    return undefined;
  }
  const [name, source] = childEntry;
  return { name, source };
}

type PropertyConfig = WebbitProperty & {
  name: string,
}

type SourceChangeObserver = {
  connect: () => void;
  disconnect: () => void;
};

class Webbit {
  static UNIQUE_ID = 0;
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
  readonly #PROPERTY_CHANGE_TOPIC;

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
    Webbit.UNIQUE_ID += 1;
    this.#PROPERTY_CHANGE_TOPIC = Symbol(`WEBBIT_ANY_PROPERTY_CHANGE_${Webbit.UNIQUE_ID}`);
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
          if (handler.isConnected()) {
            this.#onPropertyUpdate(property, value);
          }
          PubSub.publish(this.#PROPERTY_CHANGE_TOPIC, {
            property,
            value,
            connected: this.#connected,
          });
        }, true);
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

  subscribe(callback: (value: unknown) => void): void {
    PubSub.subscribe(this.#PROPERTY_CHANGE_TOPIC, (msg, value) => {
      callback(value);
    });
  }

  getPropertyHandler(name: string): PropertyHandler | undefined {
    return this.#propertyHandlers.get(name);
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

  getConfig(): WebbitConfig {
    return this.#config;
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
        const childEntries = Object.entries(children);
        [...this.#propertyHandlers.entries()].forEach(([propName, handler]) => {
          const childEntry = childEntries.find(([name]) => formatProp(name) === propName);
          if (childEntry) {
            const [, source] = childEntry;
            handler.update(source.getSourceValue());
          }
        });
      } else {
        const prop = formatProp(sourceKey.replace(`${parentKey}/`, ''));
        if (this.#propertyHandlers.has(prop)) {
          const handler = this.#propertyHandlers.get(prop);
          const value = getChildWithName(children, prop)?.source?.getSourceValue();
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
    if (typeof this.source === 'undefined') {
      return;
    }
    const propType = getValueType(value);
    const children = this.source.getChildren();
    const childEntries = Object.entries(children);

    if (!this.source.hasChildren()) {
      if (!primary) {
        return;
      }
      if (value === null) {
        if (this.source.getSourceValue() !== null) {
          this.source.setSourceValue(value);
        }
      } else {
        const newSourceValueType = getValueType(this.source.getSourceValue()) || propType;
        const newSourceValue = prop2PropValue(value, newSourceValueType);
        const newSourceBackToPropValue = prop2PropValue(newSourceValue, propType);
        if (
          isEqual(value, newSourceBackToPropValue)
          && !isEqual(this.source.getSourceValue(), newSourceValue)
        ) {
          this.source.setSourceValue(newSourceValue);
        }
      }
    } else if (value === null) {
      const childEntry = childEntries.find(([childName]) => formatProp(childName) === name);
      if (childEntry) {
        const [, source] = childEntry;
        if (source.getSourceValue() !== null) {
          source.setSourceValue(value);
        }
      }
    } else {
      const child = getChildWithName(children, name);

      if (!child) {
        return;
      }

      const newSourceValueType = getValueType(child.source.getSourceValue()) || propType;
      const newSourceValue = prop2PropValue(value, newSourceValueType);
      const newSourceBackToPropValue = prop2PropValue(newSourceValue, propType);

      if (
        isEqual(value, newSourceBackToPropValue)
        && !isEqual(child.source.getSourceValue(), newSourceValue)
      ) {
        child.source.setSourceValue(value);
      }
    }
  }
}

export default Webbit;