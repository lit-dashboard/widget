/* eslint-disable no-underscore-dangle */
import { normalizeKey } from '../../util';
// eslint-disable-next-line import/no-cycle
import Sources from '.';
import { Source } from './source-factory';

export type SourceSubscriber = (source: Source, parentKey: string, sourceKey: string) => void;
export type AllSourcesSubscriber = (source: Source, sourceKey: string) => void;

class Subscribers {
  #nextSubscriberId = 0;
  readonly #subscribers: Record<string, Record<string, Record<string, SourceSubscriber>>> = {};
  readonly #subscribersAll: Record<string, Record<string, AllSourcesSubscriber>> = {};
  readonly #sources: Sources;

  constructor(sources: Sources) {
    this.#sources = sources;
  }

  subscribe(
    providerName: string,
    key: string,
    callback: SourceSubscriber,
    callImmediately: boolean,
  ): () => void {
    if (typeof callback !== 'function') {
      throw new Error('Callback is not a function');
    }

    const normalizedKey = normalizeKey(key);

    if (this.#subscribers[providerName] === undefined) {
      this.#subscribers[providerName] = {};
    }

    if (this.#subscribers[providerName][normalizedKey] === undefined) {
      this.#subscribers[providerName][normalizedKey] = {};
    }

    const id = this.#nextSubscriberId;
    this.#nextSubscriberId += 1;
    this.#subscribers[providerName][normalizedKey][id] = callback;

    if (callImmediately) {
      const source = this.#sources.getSource(providerName, normalizeKey(key));
      if (source !== undefined) {
        callback(source, key, key);
      }
    }

    const unsubscribe = () => {
      delete this.#subscribers[providerName][normalizedKey][id];
    };

    return unsubscribe;
  }

  subscribeAll(
    providerName: string,
    callback: AllSourcesSubscriber,
    callImmediately: boolean,
  ): () => void {
    if (typeof callback !== 'function') {
      throw new Error('Callback is not a function');
    }

    if (this.#subscribersAll[providerName] === undefined) {
      this.#subscribersAll[providerName] = {};
    }

    const id = this.#nextSubscriberId;
    this.#nextSubscriberId += 1;
    this.#subscribersAll[providerName][id] = callback;

    if (callImmediately) {
      const sources = this.#sources.getSources(providerName);
      Object.getOwnPropertyNames(sources || {}).forEach(key => {
        const rawSource = this.#sources.getRawSource(providerName, key);
        if (rawSource.__fromProvider__) {
          const source = sources[key];
          callback(source, key);
        }
      });
    }

    const unsubscribe = () => {
      delete this.#subscribersAll[providerName][id];
    };

    return unsubscribe;
  }

  notifySubscribers(providerName: string, key: string): void {
    const keyParts = normalizeKey(key).split('/');
    if (providerName in this.#subscribers) {
      keyParts.forEach((keyPart, index) => {
        const sourceKey = keyParts.slice(0, index + 1).join('/');
        Object.values(this.#subscribers[providerName][sourceKey] || {}).forEach(subscriber => {
          const source = this.#sources.getSource(providerName, sourceKey);
          subscriber(source, sourceKey, normalizeKey(key));
        });
      });
    }

    if (providerName in this.#subscribersAll) {
      Object.values(this.#subscribersAll[providerName]).forEach(subscriber => {
        const source = this.#sources.getSource(providerName, key);
        subscriber(source, normalizeKey(key));
      });
    }
  }

  notifySubscribersRemoved(
    providerName: string,
    keys: Array<string>,
    keysFomProviders?: Array<string>,
  ): void {
    if (providerName in this.#subscribers) {
      Object.values(keys).forEach(key => {
        const normalizedKey = normalizeKey(key);
        Object.values(this.#subscribers[providerName][normalizedKey]).forEach(subscriber => {
          subscriber(undefined, normalizedKey, normalizedKey);
        });
      });
    }

    if (providerName in this.#subscribersAll) {
      Object.values(keysFomProviders || keys).forEach(key => {
        Object.values(this.#subscribersAll[providerName]).forEach(subscriber => {
          subscriber(undefined, key);
        });
      });
    }
  }
}

export default Subscribers;
