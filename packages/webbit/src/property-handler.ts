import { isEqual, getValueType, noop } from './util';
import {
  attr2PropValue,
  prop2AttrValue,
  prop2PropValue,
} from './value-converters/convert-to-type';
import { WebbitProperty } from './element-config';

type Subscriber = (value: unknown) => void;

type PropertyObserver = {
  connect: () => void;
  disconnect: () => void;
};

class PropertyHandler {
  readonly #element: HTMLElement;
  readonly #property: WebbitProperty;
  #connected = false;
  #defaultValue: unknown;
  #subscribers: Subscriber[] = [];
  #propertyObserver: PropertyObserver;

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
    this.#subscribers = [];
    this.#propertyObserver = this.#getPropertyObserver();
  }

  #getPropertyObserver(): PropertyObserver {
    const { changeEvent, attribute } = this.#property;

    if (changeEvent) {
      const listener = () => {
        this.#notifySubscribers();
      };
      return {
        connect: () => {
          this.#element.addEventListener(changeEvent, listener, false);
        },
        disconnect: () => {
          this.#element.removeEventListener(changeEvent, listener, false);
        },
      };
    } if (attribute) {
      const observer = new MutationObserver(() => {
        this.#notifySubscribers();
      });

      return {
        connect: () => {
          observer.observe(this.#element, {
            attributes: true,
            attributeFilter: [attribute],
          });
        },
        disconnect: () => {
          observer.disconnect();
        },
      };
    }
    return { connect: noop, disconnect: noop };
  }

  connect(): void {
    if (!this.#connected) {
      const currentValue = this.value;
      this.#defaultValue = typeof currentValue !== 'undefined'
        ? currentValue
        : this.#property.defaultValue;
      this.#propertyObserver.connect();
      this.#connected = true;
    }
  }

  disconnect(): void {
    if (this.#connected) {
      this.#connected = false;
      this.#propertyObserver.disconnect();
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

  subscribe(callback: Subscriber): void {
    this.#subscribers.push(callback);
  }

  getProperty(): WebbitProperty {
    return this.#property;
  }

  #notifySubscribers(): void {
    const { value } = this;
    this.#subscribers.forEach(subscriber => {
      subscriber(value);
    });
  }

  #setToDefault(): void {
    this.value = this.#defaultValue;
  }
}

export default PropertyHandler;