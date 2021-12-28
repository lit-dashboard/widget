import SourceProviderStore, { SourceSubscriber, AllSourcesSubscriber } from './source-provider-store';
import SourceProvider from '../source-provider';
import Source from './source';

class Store {
  #sourceProviderStores: Record<string, SourceProviderStore> = {};
  #sourceProviderListeners: Array<(provider: string) => unknown> = [];
  #defaultSourceProvider?: string;
  #defaultSourceProviderListeners: Array<(provider: string) => unknown> = [];

  hasSourceProvider(providerName: string): boolean {
    return providerName in this.#sourceProviderStores;
  }

  addSourceProvider(providerName: string, sourceProvider: SourceProvider): void {
    if (this.hasSourceProvider(providerName)) {
      throw new Error('A source provider with that name has already been added.');
    }
    const providerStore = new SourceProviderStore(sourceProvider);
    this.#sourceProviderStores[providerName] = providerStore;

    this.#sourceProviderListeners.forEach(listener => {
      listener(providerName);
    });
  }

  sourceProviderAdded(listener: (providerName: string) => void): void {
    this.#sourceProviderListeners.push(listener);
  }

  removeSourceProvider(providerName: string): void {
    if (!this.hasSourceProvider(providerName)) {
      return;
    }
    const provider = this.getSourceProvider(providerName);
    provider.disconnect();
    const providerStore = this.#sourceProviderStores[providerName];
    providerStore.unsubscribeFromProvider();
    delete this.#sourceProviderStores[providerName];
  }

  getSourceProvider(providerName: string): SourceProvider {
    return this.#sourceProviderStores[providerName].getSourceProvider();
  }

  getSourceProviderNames(): Array<string> {
    return Object.keys(this.#sourceProviderStores);
  }

  setDefaultSourceProvider(providerName: string): void {
    this.#defaultSourceProvider = providerName;

    this.#defaultSourceProviderListeners.forEach(listener => {
      listener(providerName);
    });
  }

  defaultSourceProviderSet(listener: (providerName: string) => void): void {
    if (typeof listener !== 'function') {
      throw new Error('listener is not a function');
    }

    this.#defaultSourceProviderListeners.push(listener);
  }

  getDefaultSourceProvider(): string | undefined {
    return this.#defaultSourceProvider;
  }

  getRootSource(providerName: string): Source | undefined {
    return this.#sourceProviderStores[providerName]?.getRootSource();
  }

  getRootSourceValue(providerName: string): unknown {
    return this.#sourceProviderStores[providerName]?.getRootSourceValue();
  }

  getSource(providerName: string, key: string): Source | undefined {
    return this.#sourceProviderStores[providerName]?.getSource(key);
  }

  getSourceValue(providerName: string, key: string): unknown {
    return this.#sourceProviderStores[providerName]?.getSourceValue(key);
  }

  subscribe(
    providerName: string,
    key: string,
    callback: SourceSubscriber,
    callImmediately: boolean,
  ): () => void {
    return this.#sourceProviderStores[providerName]?.subscribe(key, callback, callImmediately);
  }

  subscribeAll(
    providerName: string,
    callback: AllSourcesSubscriber,
    callImmediately: boolean,
  ): () => void {
    return this.#sourceProviderStores[providerName]?.subscribeAll(callback, callImmediately);
  }
}

export default Store;