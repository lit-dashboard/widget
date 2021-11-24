/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-cycle */
import SourceObjects from './source-object';
import Subscribers from './subscribers';
import { normalizeKey, noop } from '../../util';
import {
  createRawSource,
  createSource,
  isSourceType,
  RawSource,
  ProviderSource,
  RawSources,
  Source,
} from './source-factory';
// eslint-disable-next-line import/no-cycle
import Store from '..';

class Sources {
  readonly #rawSources: Record<string, RawSource> = {};
  readonly #sources: Record<string, ProviderSource> = {};
  readonly #sourceObjects = new SourceObjects(this);
  readonly #subscribers = new Subscribers(this);
  readonly #store: Store;

  constructor(store: Store) {
    this.#store = store;
  }

  cleanSource(
    providerName: string,
    rawSources: RawSources,
    normalizedKeyParts: Array<string>,
  ): boolean {
    if (normalizedKeyParts.length === 0) {
      return false;
    }

    const keyPart = normalizedKeyParts[0];

    const rawSource = rawSources[keyPart];

    if (typeof rawSource === 'undefined') {
      return false;
    }

    if (normalizedKeyParts.length > 1) {
      this.cleanSource(providerName, rawSource.__sources__, normalizedKeyParts.slice(1));
    }

    if (
      Object.keys(rawSource.__sources__).length === 0
      && !rawSource.__fromProvider__
    ) {
      // eslint-disable-next-line no-param-reassign
      delete rawSources[keyPart];
      delete this.#sources[providerName].sources[rawSource.__normalizedKey__];
      delete this.#sources[providerName].getterValues[rawSource.__normalizedKey__];
      delete this.#sources[providerName].setters[rawSource.__normalizedKey__];
      this.#subscribers.notifySubscribersRemoved(providerName, [rawSource.__normalizedKey__]);
    } else {
      const providerSources = this.#sources[providerName];
      this.#sourceObjects.setSourceObjectProps(providerName, rawSource);
      if (Object.keys(rawSource.__sources__).length === 0) {
        providerSources.getterValues[rawSource.__normalizedKey__] = rawSource.__value__;
      }
    }

    return true;
  }

  getRawSources(providerName: string): RawSource {
    return this.#rawSources[providerName];
  }

  getRawSource(providerName: string, key: string): RawSource | undefined {
    const sourcesRoot = this.getRawSources(providerName);

    if (typeof sourcesRoot === 'undefined') {
      return undefined;
    }

    if (typeof key !== 'string') {
      return sourcesRoot;
    }

    const keyParts = normalizeKey(key).split('/');

    let sources = sourcesRoot.__sources__;

    for (let index = 0; index < keyParts.length; index += 1) {
      const keyPart = keyParts[index];

      if (keyParts.length - 1 === index) {
        return (keyPart in sources) ? sources[keyPart] : undefined;
      }

      if (keyPart in sources) {
        sources = sources[keyPart].__sources__;
      } else {
        return undefined;
      }
    }

    return undefined;
  }

  getSources(providerName: string): Record<string, Source> | undefined {
    if (providerName in this.#sources) {
      return this.#sources[providerName].sources;
    }
    return undefined;
  }

  getSource(providerName: string, key: string): Source | undefined {
    const sources = this.getSources(providerName);
    if (sources) {
      return sources[normalizeKey(key)];
    }
    return undefined;
  }

  clearSources(providerName: string): void {
    const hasSources = providerName in this.#rawSources;

    if (!hasSources) {
      return;
    }

    const sourceKeys = Object.getOwnPropertyNames(this.getSources(providerName) || {});
    const keysFomProviders = sourceKeys
      .filter(key => this.getRawSource(providerName, key).__fromProvider__);

    Object.keys(this.#sources[providerName].getterValues).forEach(key => {
      const getterValue = this.#sources[providerName].getterValues[key];
      if (isSourceType(getterValue)) {
        Object.getOwnPropertyNames(getterValue).forEach(prop => {
          delete getterValue[prop];
        });
      }
    });

    this.#rawSources[providerName] = createRawSource();
    this.#sources[providerName] = createSource();

    this.#subscribers.notifySubscribersRemoved(providerName, sourceKeys, keysFomProviders);
  }

  removeSources(providerName: string): void {
    const hasSources = providerName in this.#rawSources;

    if (!hasSources) {
      return;
    }

    const sourceKeys = Object.getOwnPropertyNames(this.getSources(providerName));
    const keysFomProviders = sourceKeys
      .filter(key => this.getRawSource(providerName, key).__fromProvider__);

    Object.keys(this.#sources[providerName].getterValues).forEach(key => {
      const getterValue = this.#sources[providerName].getterValues[key];
      if (isSourceType(getterValue)) {
        Object.getOwnPropertyNames(getterValue).forEach(prop => {
          delete getterValue[prop];
        });
      }
    });

    delete this.#rawSources[providerName];
    delete this.#sources[providerName];

    this.#subscribers.notifySubscribersRemoved(providerName, sourceKeys, keysFomProviders);
  }

  sourcesRemoved(providerName: string, sourceRemovals: Array<string>): void {
    if (typeof this.#rawSources[providerName] === 'undefined') {
      return;
    }

    const sourcesRoot = this.#rawSources[providerName];

    for (let i = 0; i < sourceRemovals.length; i += 1) {
      const key = sourceRemovals[i];
      const normalizedKey = normalizeKey(key);
      const normalizedKeyParts = normalizedKey.split('/');

      let rawSources = sourcesRoot.__sources__;

      for (let j = 0; j < normalizedKeyParts.length; j += 1) {
        const keyPart = normalizedKeyParts[j];
        const inSources = keyPart in rawSources;

        if (!inSources) {
          break;
        }

        if (normalizedKeyParts.length - 1 === j) {
          rawSources[keyPart].__fromProvider__ = false;
          rawSources[keyPart].__value__ = undefined;
        }

        rawSources = rawSources[keyPart].__sources__;
      }

      this.cleanSource(providerName, sourcesRoot.__sources__, normalizedKeyParts);
    }
  }

  sourcesChanged(providerName: string, sourceChanges: Record<string, unknown>): void {
    const sources = this.#sources;

    if (typeof this.#rawSources[providerName] === 'undefined') {
      this.#rawSources[providerName] = createRawSource();
      sources[providerName] = createSource();
    }

    const sourcesRoot = this.#rawSources[providerName];

    Object.keys(sourceChanges).forEach(key => {
      const value = sourceChanges[key];

      const keyParts = key.split('/');
      const normalizedKey = normalizeKey(key);
      const normalizedKeyParts = normalizedKey.split('/');

      let rawSources = sourcesRoot.__sources__;
      let prevRawSource: RawSource | undefined;

      normalizedKeyParts.forEach((keyPart, index) => {
        const inSources = keyPart in rawSources;
        const sourceKey = keyParts.slice(0, index + 1).join('/');
        const providerSources = sources[providerName];
        const normalizedKeyPartsJoined = normalizedKeyParts.slice(0, index + 1).join('/');

        if (!inSources) {
          rawSources[keyPart] = {
            __fromProvider__: false,
            __normalizedKey__: normalizedKeyPartsJoined,
            __key__: sourceKey,
            __value__: undefined,
            __sources__: {},
          };

          providerSources.getterValues[normalizedKeyPartsJoined] = (
            this.#sourceObjects.getSourceObject(providerName, sourceKey)
          );
          providerSources.setters[normalizedKeyPartsJoined] = noop;
          Object.defineProperty(providerSources.sources, normalizedKeyPartsJoined, {
            configurable: true,
            set(propertyValue: unknown) {
              const providerSourcesForProp = sources[providerName];

              if (typeof providerSourcesForProp === 'undefined') {
                return;
              }

              const setter = providerSourcesForProp.setters[normalizedKeyPartsJoined];

              if (typeof setter === 'undefined') {
                return;
              }

              setter(propertyValue);
            },
            get() {
              if (typeof sources[providerName] === 'undefined') {
                return undefined;
              }
              return sources[providerName].getterValues[normalizedKeyPartsJoined];
            },
          });
        }

        if (normalizedKeyParts.length - 1 === index) {
          rawSources[keyPart].__fromProvider__ = true;
          rawSources[keyPart].__value__ = value;

          if (Object.keys(rawSources[keyPart].__sources__).length === 0) {
            providerSources.getterValues[normalizedKeyPartsJoined] = value;
          }

          const sourceProvider = this.#store.getSourceProvider(providerName);
          providerSources.setters[normalizedKeyPartsJoined] = (setterValue) => {
            sourceProvider.userUpdate(sourceKey, setterValue);
          };
        }

        if (index !== 0) {
          if (!isSourceType(providerSources.getterValues[prevRawSource.__normalizedKey__])) {
            providerSources.getterValues[prevRawSource.__normalizedKey__] = (
              this.#sourceObjects.getSourceObject(providerName, prevRawSource.__normalizedKey__)
            );
          }

          this.#sourceObjects.setSourceObjectProps(providerName, prevRawSource);
        }

        prevRawSource = rawSources[keyPart];
        rawSources = rawSources[keyPart].__sources__;
      });

      this.#subscribers.notifySubscribers(providerName, key);
    });
  }

  subscribe(
    providerName: string,
    key: string,
    callback: (source: Source, parentKey: string, sourceKey: string) => void,
    callImmediately: boolean,
  ): () => void {
    return this.#subscribers.subscribe(providerName, key, callback, callImmediately);
  }

  subscribeAll(
    providerName: string,
    callback: (source: Source, sourceKey: string) => void,
    callImmediately: boolean,
  ): () => void {
    return this.#subscribers.subscribeAll(providerName, callback, callImmediately);
  }
}

export default Sources;
