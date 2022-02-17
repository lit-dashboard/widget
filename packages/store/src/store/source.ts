import SourceProvider from '../source-provider';

class Source {
  readonly #key: string;
  readonly #children: Record<string, Source> = {};
  readonly #parent?: Source;
  #value: unknown;
  #hasValue = false;
  readonly #sourceObject: Record<string, unknown>;
  readonly #provider: SourceProvider;

  constructor(
    provider: SourceProvider,
    sourceObject: Record<string, unknown>,
    key: string,
    parent?: Source,
  ) {
    this.#provider = provider;
    this.#sourceObject = sourceObject;
    this.#key = key;
    this.#parent = parent;
  }

  getKey(): string {
    return this.#key;
  }

  hasValue(): boolean {
    return this.#hasValue;
  }

  getValue(): unknown {
    return this.#value;
  }

  setValue(value: unknown): void {
    this.#value = value;
    this.#hasValue = true;
  }

  removeValue(): void {
    this.#value = undefined;
    this.#hasValue = false;
  }

  getSourceValue(): unknown {
    return this.hasChildren() ? this.#sourceObject : this.#value;
  }

  setSourceValue(value: unknown): void {
    this.#provider.userUpdate(this.#key, value);
  }

  getChildren(): Record<string, Source> {
    return this.#children;
  }

  hasChildren(): boolean {
    return Object.getOwnPropertyNames(this.#children).length > 0;
  }

  addChild(key: string, source: Source): void {
    const property = key.split('/').at(-1);
    if (typeof property === 'undefined') {
      return;
    }
    this.#children[property] = source;
    if (typeof property === 'undefined') {
      return;
    }
    Object.defineProperty(this.#sourceObject, property, {
      configurable: true,
      enumerable: true,
      set(value: unknown) {
        source.setSourceValue(value);
      },
      get() {
        return source.getSourceValue();
      },
    });
  }

  removeChild(key: string): void {
    const property = key.split('/').at(-1);
    if (typeof property !== 'undefined') {
      delete this.#children[property];
      delete this.#sourceObject[property];
    }
  }

  getParent(): Source | undefined {
    return this.#parent;
  }
}

export default Source;