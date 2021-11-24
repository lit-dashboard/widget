/* eslint-disable no-underscore-dangle */
import { normalizeKey } from '../../util';
import { RawSource, Source } from './source-factory';
// eslint-disable-next-line import/no-cycle
import Sources from '.';

class SourceObjects {
  readonly sources: Sources;
  readonly sourceObjectRefs: Record<string, Record<string, Source>> = {};
  constructor(sources: Sources) {
    this.sources = sources;
  }

  getSourceObject(providerName: string, key: string): Source {
    const normalizedKey = normalizeKey(key);

    if (typeof this.sourceObjectRefs[providerName] === 'undefined') {
      this.sourceObjectRefs[providerName] = {};
    }

    if (typeof this.sourceObjectRefs[providerName][normalizedKey] === 'undefined') {
      this.sourceObjectRefs[providerName][normalizedKey] = new Source();
    }

    return this.sourceObjectRefs[providerName][normalizedKey];
  }

  setSourceObjectProps(providerName: string, rawSource: RawSource): void {
    const sourceObject = this.getSourceObject(providerName, rawSource.__normalizedKey__);
    const { sources } = this;

    Object.getOwnPropertyNames(sourceObject).forEach(prop => {
      if (prop in rawSource.__sources__) {
        return;
      }
      delete sourceObject[prop];
    });

    const rawSourceKeys = Object.keys(rawSource.__sources__);

    for (let i = 0; i < rawSourceKeys.length; i += 1) {
      const key = rawSourceKeys[i];
      const normalizedKey = normalizeKey(key);
      if (normalizedKey in sourceObject) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const rawSubSource = rawSource.__sources__[key];
      Object.defineProperty(sourceObject, normalizedKey, {
        configurable: true,
        set(value) {
          const providerSources = sources[providerName];

          if (typeof providerSources === 'undefined') {
            return;
          }

          const setter = providerSources.setters[rawSubSource.__normalizedKey__];

          if (typeof setter === 'undefined') {
            return;
          }

          setter(value);
        },
        get() {
          if (typeof sources[providerName] === 'undefined') {
            return undefined;
          }
          return sources[providerName].getterValues[rawSubSource.__normalizedKey__];
        },
      });
    }
  }
}

export default SourceObjects;
