/* eslint-disable import/no-cycle */
import { Source } from './sources/source-factory';
import Sources from './sources';
import SourceProvider from '../source-provider';
import { SourceSubscriber, AllSourcesSubscriber } from './sources/subscribers';

type HandlerUnsubscribers = {
  clearSources: () => void,
  sourcesChanged: () => void,
  sourcesRemoved: () => void,
};

/**
 @module @webbitjs/store
*/
class Store {
  #providers: Record<string, SourceProvider> = {};
  #defaultSourceProvider?: string;
  #sourceProviderListeners: Array<(provider: string) => unknown> = [];
  #defaultSourceProviderListeners: Array<(provider: string) => unknown> = [];
  #sources = new Sources(this);
  #handlerUnsubscribersMap: Map<string, HandlerUnsubscribers> = new Map();

  hasSourceProvider(providerName: string): boolean {
    return providerName in this.#providers;
  }

  addSourceProvider(providerName: string, sourceProvider: SourceProvider): void {
    if (this.hasSourceProvider(providerName)) {
      throw new Error('A source provider with that name has already been added.');
    }
    this.#providers[providerName] = sourceProvider;

    this.#sourceProviderListeners.forEach(listener => {
      listener(providerName);
    });

    this.#handlerUnsubscribersMap.set(providerName, {
      clearSources: sourceProvider.addClearSourcesHandler(() => {
        this.#sources.clearSources(providerName);
      }),
      sourcesChanged: sourceProvider.addSourcesChangedHandler(sourceChanges => {
        this.#sources.sourcesChanged(providerName, sourceChanges);
      }),
      sourcesRemoved: sourceProvider.addSourcesRemovedHandler(removals => {
        this.#sources.sourcesRemoved(providerName, removals);
      }),
    });
  }

  sourceProviderAdded(listener: (providerName: string) => void): void {
    this.#sourceProviderListeners.push(listener);
  }

  removeSourceProvider(providerName: string): void {
    if (!this.hasSourceProvider(providerName)) {
      return;
    }

    const provider = this.#providers[providerName];
    provider.disconnect();
    delete this.#providers[providerName];
    const {
      clearSources,
      sourcesChanged,
      sourcesRemoved,
    } = this.#handlerUnsubscribersMap.get(providerName);
    clearSources();
    sourcesChanged();
    sourcesRemoved();
    this.#handlerUnsubscribersMap.delete(providerName);
  }

  getSourceProvider(providerName: string): SourceProvider {
    return this.#providers[providerName];
  }

  getSourceProviderNames(): Array<string> {
    return Object.keys(this.#providers);
  }

  setDefaultSourceProvider(providerName: string): void {
    this.#defaultSourceProvider = providerName;

    this.#defaultSourceProviderListeners.forEach(listener => {
      listener(this.#defaultSourceProvider);
    });
  }

  defaultSourceProviderSet(listener: (providerName: string) => void): void {
    if (typeof listener !== 'function') {
      throw new Error('listener is not a function');
    }

    this.#defaultSourceProviderListeners.push(listener);
  }

  getDefaultSourceProvider(): string {
    return this.#defaultSourceProvider;
  }

  getRawSources(providerName: string): Record<string, unknown> {
    return this.#sources.getRawSources(providerName);
  }

  getRawSource(providerName: string, key: string): Record<string, unknown> {
    return this.#sources.getRawSource(providerName, key);
  }

  getSources(providerName: string): Record<string, Source> | undefined {
    return this.#sources.getSources(providerName);
  }

  getSource(providerName: string, key: string): Source | undefined {
    return this.#sources.getSource(providerName, key);
  }

  subscribe(
    providerName: string,
    key: string,
    callback: SourceSubscriber,
    callImmediately: boolean,
  ): () => void {
    return this.#sources.subscribe(providerName, key, callback, callImmediately);
  }

  subscribeAll(
    providerName: string,
    callback: AllSourcesSubscriber,
    callImmediately: boolean,
  ): () => void {
    return this.#sources.subscribeAll(providerName, callback, callImmediately);
  }
}

export default Store;
