import { normalizeKey } from '../../util';
import { Source } from './source-factory';

class SourceObjects {

  constructor(sources) {
    this.sources = sources;
    this.sourceObjectRefs = {};
  }

  getSourceObject(providerName, key) {

    const normalizedKey = normalizeKey(key);
  
    if (typeof this.sourceObjectRefs[providerName] === 'undefined') {
      this.sourceObjectRefs[providerName] = {};
    }
  
    if (typeof this.sourceObjectRefs[providerName][normalizedKey] === 'undefined') {
      this.sourceObjectRefs[providerName][normalizedKey] = new Source();
    }
  
    return this.sourceObjectRefs[providerName][normalizedKey];
  }

  setSourceObjectProps(providerName, rawSource) {
    const sourceObject = this.getSourceObject(providerName, rawSource.__normalizedKey__);
    const sources = this.sources;
  
    Object.getOwnPropertyNames(sourceObject).forEach(prop => {
      if (prop in rawSource.__sources__) {
        return;
      }
      delete sourceObject[prop];
    });
  
    for (let key in rawSource.__sources__) {
  
      const normalizedKey = normalizeKey(key);
      if (normalizedKey in sourceObject) {
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
        }
      });
    }
  }
}

export default SourceObjects;
