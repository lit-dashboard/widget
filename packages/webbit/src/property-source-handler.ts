import Store, { Source } from '@webbitjs/store';
import PropertyHandler from './property-handler';
import { isEqual, noop, getValueType } from './util';
import { prop2PropValue } from './value-converters/convert-to-type';

export default class PropertySourceHandler {
  #sourceProvider?: string;
  #sourceKey?: string;
  #unsubscribe: () => void = noop;
  readonly #store: Store;
  readonly #propertyHandler: PropertyHandler;
  #connected = false;

  constructor(store: Store, propertyHandler: PropertyHandler) {
    this.#store = store;
    this.#propertyHandler = propertyHandler;

    this.#propertyHandler.subscribe(value => {
      if (this.#propertyHandler.isConnected()) {
        this.#onPropertyUpdate(value);
      }
    }, true);
  }

  get source(): Source | undefined {
    if (typeof this.#sourceProvider !== 'undefined' && typeof this.#sourceKey !== 'undefined') {
      return this.#store.getSource(this.#sourceProvider, this.#sourceKey);
    }
    return undefined;
  }

  get hasSource(): boolean {
    return typeof this.source !== 'undefined';
  }

  connect(): void {
    if (!this.#connected) {
      this.#connected = true;
      this.#propertyHandler.connect();
      this.#updateSubscription();
    }
  }

  disconnect(): void {
    if (this.#connected) {
      this.#connected = false;
      this.#propertyHandler.disconnect();
      this.#updateSubscription();
    }
  }

  setSource(provider: string, key: string): void {
    this.#sourceProvider = provider;
    this.#sourceKey = key;
    this.#updateSubscription();
  }

  removeSource(): void {
    this.#sourceProvider = undefined;
    this.#sourceKey = undefined;
  }

  #updateSubscription(): void {
    if (!this.#connected) {
      this.#unsubscribe();
      this.#unsubscribe = noop;
      return;
    }

    if (!this.#sourceKey || !this.#sourceProvider) {
      this.#unsubscribe();
      this.#unsubscribe = noop;
    } else {
      this.#unsubscribe();
      this.#unsubscribe = this.#store.subscribe(
        this.#sourceProvider,
        this.#sourceKey,
        () => {
          this.#subscriber();
        },
        true,
      );
    }
  }

  #subscriber(): void {
    if (typeof this.source === 'undefined') {
      // source has been removed, so set attributes to defaults
      this.#propertyHandler.disconnect();
    } else {
      const value = this.source.getSourceValue();
      if (typeof value === 'undefined') {
        this.#propertyHandler.disconnect();
      } else {
        this.#propertyHandler.update(value);
      }
    }
  }

  #onPropertyUpdate(value: unknown): void {
    if (typeof this.source === 'undefined') {
      return;
    }
    const propType = getValueType(value);

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
  }
}