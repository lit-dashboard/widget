import SourceProvider from '../source-provider';
import Source from './source';
import { isSourceDead } from './utils';

export type SourceSubscriber = (sourceValue: unknown, parentKey: string, sourceKey: string) => void;
export type AllSourcesSubscriber = (sourceValue: unknown, sourceKey: string) => unknown;
type HandlerUnsubscribers = {
  clearSources: () => void,
  sourcesChanged: () => void,
  sourcesRemoved: () => void,
};

class SourceProviderStore {
  readonly #sourceObjects = new Map<string, Record<string, unknown>>();
  readonly #originalKeys = new Set<string>();
  readonly #sources = new Map<string, Source>();
  readonly #provider: SourceProvider;
  readonly #subscribers: Record<string, Map<symbol, SourceSubscriber>> = {};
  readonly #allSubscribers: Map<symbol, AllSourcesSubscriber> = new Map();
  readonly #handlerUnsubscribers: HandlerUnsubscribers;

  constructor(provider: SourceProvider) {
    this.#provider = provider;

    this.#handlerUnsubscribers = {
      clearSources: provider.addClearSourcesHandler(() => {
        this.clearSources();
      }),
      sourcesChanged: provider.addSourcesChangedHandler(sourceChanges => {
        Object.entries(sourceChanges).forEach(([key, value]) => {
          this.updateSource(key, value, false);
        });
        Object.entries(sourceChanges).forEach(([key]) => {
          this.#notifySubscribers(key);
        });
      }),
      sourcesRemoved: provider.addSourcesRemovedHandler(removals => {
        const filteredRemovals = removals.filter(key => this.#sources.has(key));
        filteredRemovals.forEach(key => this.removeSource(key), false);
        filteredRemovals.forEach(key => {
          this.#notifySubscribers(key);
        });
      }),
    };
  }

  getSourceProvider(): SourceProvider {
    return this.#provider;
  }

  getSource(key: string): Source | undefined {
    return this.#sources.get(key);
  }

  getSourceValue(key: string): unknown {
    return this.getSource(key)?.getSourceValue();
  }

  updateSource(key: string, value: unknown, notify = true): void {
    this.#setOriginalKey(key);
    this.#createSources(key);
    const source = this.#sources.get(key);
    source?.setValue(value);
    if (notify) {
      this.#notifySubscribers(key);
    }
  }

  clearSources(): void {
    const keys: string[] = [];
    this.#sources.forEach((source, key) => {
      keys.push(key);
      this.removeSource(key, false);
    });
    keys.forEach(key => this.#notifySubscribers(key));
  }

  removeSource(key: string, notify = true): void {
    const source = this.#sources.get(key);
    if (source) {
      source.removeValue();
      this.#cleanSources(source);
      if (notify) {
        this.#notifySubscribers(key);
      }
      this.#originalKeys.delete(key);
    }
  }

  subscribe(key: string, callback: SourceSubscriber, callImmediately: boolean): () => void {
    if (typeof this.#subscribers[key] === 'undefined') {
      this.#subscribers[key] = new Map();
    }
    const symbol = Symbol('SourceSubscriber');
    this.#subscribers[key].set(symbol, callback);
    if (callImmediately) {
      callback(this.getSourceValue(key), key, key);
    }
    return () => {
      this.#subscribers[key].delete(symbol);
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
    if (!this.#originalKeys.has(key)) {
      this.#originalKeys.add(key);
    }
  }

  #createSources(key: string): void {
    const keyParts = key.split('/');
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
    const keyParts = key.split('/');
    const sourceValue = this.getSourceValue(key);

    keyParts.forEach((keyPart, index) => {
      const parentKey = keyParts.slice(0, index + 1).join('/');
      if (parentKey in this.#subscribers) {
        this.#subscribers[parentKey].forEach(subscriber => {
          subscriber(this.getSourceValue(parentKey), parentKey, key);
        });
      }
    });

    this.#allSubscribers.forEach(subscriber => {
      subscriber(sourceValue, key);
    });
  }
}

export default SourceProviderStore;