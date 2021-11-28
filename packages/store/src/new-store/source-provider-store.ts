import SourceProvider from '../source-provider';
import Source from './source';
import { getNormalizedKey, isSourceDead } from './utils';

class SourceProviderStore {
  readonly #sourceObjects = new Map<string, Record<string, unknown>>();
  readonly #originalKeys = new Map<string, string>();
  readonly #sources = new Map<string, Source>();
  readonly #provider: SourceProvider;

  constructor(provider: SourceProvider) {
    this.#provider = provider;
    this.#sources.set('', new Source(provider, {}, ''));
  }

  getSource(key: string): Source | undefined {
    const normalizedKey = getNormalizedKey(key);
    return this.#sources.get(normalizedKey);
  }

  getSourceValue(key: string): unknown {
    return this.getSource(key)?.getSourceValue();
  }

  getRootSourceValue(): unknown {
    return this.#sources.get('')?.getSourceValue();
  }

  updateSource(key: string, value: unknown): void {
    this.#setOriginalKey(key);
    this.#createSources(key);
    const normalizedKey = getNormalizedKey(key);
    const source = this.#sources.get(normalizedKey);
    source.setValue(value);
  }

  removeSource(key: string): void {
    const normalizedKey = getNormalizedKey(key);
    const source = this.#sources.get(normalizedKey);
    source.removeValue();
    this.#cleanSources(source);
  }

  #setOriginalKey(key: string): void {
    const normalizedKey = getNormalizedKey(key);
    if (!this.#originalKeys.has(normalizedKey)) {
      this.#originalKeys.set(normalizedKey, key);
    }
  }

  #createSources(key: string): void {
    const normalizedKey = getNormalizedKey(key);
    const keyParts = normalizedKey.split('/');
    let parentKey;
    keyParts.forEach((part, index) => {
      const childKey = keyParts.slice(0, index + 1).join('/');
      if (!this.#sources.has(childKey)) {
        const parentSource = this.#sources.get(parentKey);
        const childSource = new Source(
          this.#provider,
          this.#getSourceObject(childKey),
          childKey,
          parentSource,
        );
        this.#sources.set(childKey, childSource);
        parentSource.addChild(childKey, childSource);
      }
      parentKey = childKey;
    });
  }

  #cleanSources(source: Source): void {
    const isDead = isSourceDead(source);
    const parent = source.getParent();
    if (isDead && parent) {
      parent.removeChild(source.getKey());
      this.#sources.delete(source.getKey());
      this.#cleanSources(parent);
    }
  }

  #getSourceObject(normalizedKey: string): Record<string, unknown> {
    if (!this.#sourceObjects.has(normalizedKey)) {
      this.#sourceObjects.set(normalizedKey, {});
    }
    return this.#sourceObjects.get(normalizedKey);
  }
}

export default SourceProviderStore;