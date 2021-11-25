import SourceProvider from '../source-provider';

class Source {
  readonly #originalKey: string;
  #value: unknown;
  #hasValue = false;
  readonly #sources: Record<string, Source> = {};
  readonly #sourcesObject: Record<string, unknown> = {};
  readonly #provider: SourceProvider;

  constructor(provider: SourceProvider) {
    this.#provider = provider;
  }

  isDead(): boolean {
    if (this.hasSourceValue()) {
      return false;
    }
    return Object.values(this.#sources).every(source => source.isDead());
  }

  getOriginalKey(): string {
    return this.#originalKey;
  }

  hasSourceValue(): boolean {
    return this.#hasValue;
  }

  getSourceValue(): unknown {
    return this.#value;
  }

  getSources(): Record<string, Source> {
    return this.#sources;
  }

  hasSources(): boolean {
    return Object.keys(this.#sources).length > 0;
  }

  getValue(): unknown {
    return this.hasSources() ? this.#sourcesObject : this.#value;
  }

  setValue(value: unknown): void {
    this.#provider.userUpdate(this.#originalKey, value);
  }

  updateSource(key: string, value: unknown): void {
    if (key === '') {
      this.#value = value;
      this.#hasValue = true;
    } else {
      const keyParts = key.split('/');
      const prop = keyParts[0];
      const childKey = keyParts.slice(1).join('/');
      this.#sources[prop].updateSource(childKey, value);
    }
  }

  removeSource(key: string): void {
    if (key === '') {
      this.#value = undefined;
      this.#hasValue = false;
    } else {
      const keyParts = key.split('/');
      const prop = keyParts[0];
      const childKey = keyParts.slice(1).join('/');
      this.#sources[prop].removeSource(childKey);
    }
  }

  #updateSourceObject(): void {
    Object.getOwnPropertyNames(this.#sourcesObject).forEach(key => {
      delete this.#sourcesObject[key];
    });
    Object.entries(this.#sources).forEach(([key, source]) => {
      Object.defineProperty(this.#sourcesObject, key, {
        configurable: true,
        set(value: unknown) {
          source.setValue(value);
        },
        get() {
          return source.getValue();
        },
      });
    });
  }
}

export default Source;