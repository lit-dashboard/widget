import SourceProvider from '../source-provider';
import Source from './source';
import { getNormalizedKey, isSourceDead } from './utils';

export type SourceSubscriber = (sourceValue: unknown, parentKey: string, sourceKey: string) => void;
export type AllSourcesSubscriber = (sourceValue: unknown, sourceKey: string) => () => void;
type HandlerUnsubscribers = {
  clearSources: () => void,
  sourcesChanged: () => void,
  sourcesRemoved: () => void,
};

class SourceProviderStore {
  readonly #sourceObjects = new Map<string, Record<string, unknown>>();
  readonly #originalKeys = new Map<string, string>();
  readonly #sources = new Map<string, Source>();
  readonly #provider: SourceProvider;
  readonly #subscribers: Record<string, Map<symbol, SourceSubscriber>> = {};
  readonly #allSubscribers: Map<symbol, AllSourcesSubscriber> = new Map();
  readonly #handlerUnsubscribers: HandlerUnsubscribers;

  constructor(provider: SourceProvider) {
    this.#provider = provider;
    this.#sources.set('', new Source(provider, {}, ''));

    this.#handlerUnsubscribers = {
      clearSources: provider.addClearSourcesHandler(() => {
        this.clearSources();
      }),
      sourcesChanged: provider.addSourcesChangedHandler(sourceChanges => {
        Object.entries(sourceChanges).forEach(([key, value]) => {
          this.updateSource(key, value);
        });
      }),
      sourcesRemoved: provider.addSourcesRemovedHandler(removals => {
        removals.forEach(key => this.removeSource(key));
      }),
    };
  }

  getSourceProvider(): SourceProvider {
    return this.#provider;
  }

  getSource(key: string): Source | undefined {
    const normalizedKey = getNormalizedKey(key);
    return this.#sources.get(normalizedKey);
  }

  getSourceValue(key: string): unknown {
    return this.getSource(key)?.getSourceValue();
  }

  getRootSource(): Source {
    return this.#sources.get('') as Source;
  }

  getRootSourceValue(): unknown {
    return this.getRootSource().getSourceValue();
  }

  updateSource(key: string, value: unknown): void {
    this.#setOriginalKey(key);
    this.#createSources(key);
    const normalizedKey = getNormalizedKey(key);
    const source = this.#sources.get(normalizedKey);
    source?.setValue(value);
    this.#notifySubscribers(key);
  }

  clearSources(): void {
    this.#sources.forEach((source, key) => this.removeSource(key));
  }

  removeSource(key: string): void {
    const normalizedKey = getNormalizedKey(key);
    const source = this.#sources.get(normalizedKey);
    if (source) {
      source.removeValue();
      this.#cleanSources(source);
      this.#notifySubscribers(key);
      this.#originalKeys.delete(normalizedKey);
    }
  }

  subscribe(key: string, callback: SourceSubscriber, callImmediately: boolean): () => void {
    const normalizedKey = getNormalizedKey(key);
    if (typeof this.#subscribers[normalizedKey] === 'undefined') {
      this.#subscribers[normalizedKey] = new Map();
    }
    const symbol = Symbol('SourceSubscriber');
    this.#subscribers[normalizedKey].set(symbol, callback);
    if (callImmediately) {
      callback(this.getSourceValue(key), key, key);
    }
    return () => {
      this.#subscribers[normalizedKey].delete(symbol);
    };
  }

  subscribeAll(callback: AllSourcesSubscriber, callImmediately: boolean): () => void {
    const symbol = Symbol('SourceSubscriberAll');
    this.#allSubscribers.set(symbol, callback);
    if (callImmediately) {
      this.#originalKeys.forEach(key => {
        callback(this.getSourceValue(key), key);
      });
    }
    return () => {
      this.#allSubscribers.delete(symbol);
    };
  }

  unsubscribeFromProvider(): void {
    const { clearSources, sourcesChanged, sourcesRemoved } = this.#handlerUnsubscribers;
    clearSources();
    sourcesChanged();
    sourcesRemoved();
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
    let parentKey: string;
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
        parentSource?.addChild(childKey, childSource);
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
    return this.#sourceObjects.get(normalizedKey) as Record<string, unknown>;
  }

  #notifySubscribers(key: string): void {
    const normalizedKey = getNormalizedKey(key);
    const keyParts = normalizedKey.split('/');
    const originalKey = this.#originalKeys.get(normalizedKey);
    const sourceValue = this.getSourceValue(key);

    if (!originalKey) {
      return;
    }

    keyParts.forEach((keyPart, index) => {
      const parentKey = keyParts.slice(1, index + 1).join('/');
      const normalizedParentKey = keyParts.slice(0, index + 1).join('/');
      if (normalizedParentKey in this.#subscribers) {
        this.#subscribers[normalizedParentKey].forEach(subscriber => {
          const originalParentKey = this.#originalKeys.get(normalizedParentKey) ?? parentKey;
          subscriber(this.getSourceValue(parentKey), originalParentKey, originalKey);
        });
      }
    });

    this.#allSubscribers.forEach(subscriber => {
      subscriber(sourceValue, originalKey);
    });
  }
}

export default SourceProviderStore;