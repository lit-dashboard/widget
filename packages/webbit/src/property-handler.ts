import * as PubSub from 'pubsub-js';
import { isEqual, getValueType } from './util';
import {
  attr2PropValue,
  prop2AttrValue,
  prop2PropValue,
} from './value-converters/convert-to-type';
import { WebbitProperty } from './element-config';

class PropertyHandler {
  readonly #element: HTMLElement;
  readonly #property: WebbitProperty;
  #connected = false;
  #defaultValue: unknown;
  readonly #PROPERTY_CHANGE_TOPIC = Symbol('WEBBIT_PROPERTY_CHANGE');

  get value(): unknown {
    const {
      reflect, attribute, property, type,
    } = this.#property;

    if (property in this.#element) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this.#element as any)[property];
    } if (attribute && reflect) {
      return attr2PropValue(this.#element.getAttribute(attribute), type);
    }
    return attr2PropValue(attribute ? this.#element.getAttribute(attribute) : null, type);
  }

  set value(value: unknown) {
    const { attribute, property, type } = this.#property;
    const newValueType = getValueType(value);
    const currentValue = this.value;

    if (value === null || typeof value === 'undefined') {
      if (value === currentValue) {
        return;
      }
    } else if (isEqual(prop2PropValue(currentValue, newValueType), value)) {
      return;
    }

    if (property) {
      const newPropValue = prop2PropValue(value, type);
      const newPropBackToValue = prop2PropValue(newPropValue, newValueType);
      if (isEqual(value, newPropBackToValue)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.#element as any)[property] = newPropValue;
      }
    } else if (attribute) {
      const newAttrValue = prop2AttrValue(value, type);
      const newAttrBackToValue = attr2PropValue(newAttrValue, newValueType);

      if (isEqual(value, newAttrBackToValue)) {
        if (newAttrValue === null) {
          this.#element.removeAttribute(attribute);
        } else {
          this.#element.setAttribute(attribute, newAttrValue);
        }
      }
    }
  }

  constructor(element: HTMLElement, property: WebbitProperty) {
    this.#element = element;
    this.#property = property;
    this.#connected = false;
    this.#defaultValue = this.#property.defaultValue;
    this.#getPropertyObserver();
  }

  #getPropertyObserver(): void {
    const { changeEvent, attribute } = this.#property;

    if (changeEvent) {
      const listener = () => {
        this.#notifySubscribers();
      };
      this.#element.addEventListener(changeEvent, listener, false);
    } else if (attribute) {
      const observer = new MutationObserver(() => {
        this.#notifySubscribers();
      });
      observer.observe(this.#element, {
        attributes: true,
        attributeFilter: [attribute],
      });
    }
  }

  connect(): void {
    if (!this.#connected) {
      const currentValue = this.value;
      this.#defaultValue = typeof currentValue !== 'undefined'
        ? currentValue
        : this.#property.defaultValue;
      this.#connected = true;
    }
  }

  disconnect(): void {
    if (this.#connected) {
      this.#connected = false;
      this.#setToDefault();
    }
  }

  isConnected(): boolean {
    return this.#connected;
  }

  update(value: unknown): void {
    this.connect();
    this.value = value;
  }

  subscribe(callback: (value: unknown) => void, listenWhenDisconnected = false): void {
    PubSub.subscribe(this.#PROPERTY_CHANGE_TOPIC, (msg, value) => {
      if (this.#connected || listenWhenDisconnected) {
        callback(value);
      }
    });
  }

  getProperty(): WebbitProperty {
    return this.#property;
  }

  #notifySubscribers(): void {
    const { value } = this;
    PubSub.publish(this.#PROPERTY_CHANGE_TOPIC, value);
  }

  #setToDefault(): void {
    this.value = this.#defaultValue;
  }
}

export default PropertyHandler;