import { LitElement } from 'lit';
import ResizeObserver from 'resize-observer-polyfill';

type WebbitConstructor = {
  properties: {
    [property: string]: {
      defaultValue?: unknown,
      type?: (...args: unknown[]) => unknown | string,
      get?: (value: unknown) => unknown,
      set?: (value: unknown) => unknown,
    }
  }
};

const getDefaultValue = (type?: (...args: unknown[]) => unknown | string) => {
  const defaultValues: Record<string, unknown> = {
    String: '',
    Number: 0,
    Boolean: false,
    Array: [],
    Object: {},
  };
  if (!type) {
    return '';
  }
  return defaultValues[type?.name ?? type] ?? '';
};

export default abstract class WebbitElement extends LitElement {
  static properties = {};

  constructor() {
    super();

    const constructor = this.constructor as unknown as WebbitConstructor;

    Object.entries(constructor.properties).forEach(([name, property]) => {
      const {
        defaultValue,
        type,
        get: getter,
        set: setter,
      } = property;

      if (typeof getter === 'function' || typeof setter === 'function') {
        Object.defineProperty(this, name, {
          get() {
            if (typeof getter === 'function') {
              return getter.bind(this)(this[`#${name}`]);
            }
            return this[`#${name}`];
          },
          set(value) {
            const oldValue = this[`#${name}`];
            this[`#${name}`] = typeof setter === 'function'
              ? setter.bind(this)(value)
              : value;
            this.requestUpdate(name, oldValue);
          },
        });
      }

      const element = this as Record<string, unknown>;
      element[name] = typeof defaultValue !== 'undefined' ? defaultValue : getDefaultValue(type);
    });

    const resizeObserver = new ResizeObserver(() => {
      this.resized();
    });
    resizeObserver.observe(this);
  }

  abstract resized(): void;
}
