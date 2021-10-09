import Sources from './sources';

/**
 @module @webbitjs/store
*/
class Store {

  constructor() {
    this.providerTypes = {};
    this.providers = {};
    this.defaultSourceProvider = null;
    this.sourceProviderListeners = [];
    this.defaultSourceProviderListeners = [];
    this.sources = new Sources(this);
  }

  /**
 * Adds a provider type.
 * 
 * @function
 * @example
 * import { SourceProvider, addSourceProviderType } from "@webbitjs/store";
 * 
 * class MyProvider extends SourceProvider {
 *   // class body
 * }
 * 
 * addSourceProviderType(MyProvider);
 * 
 * @param {SourceProvider} constructor - The source provider class
 */
  addSourceProviderType(constructor) {

    const { typeName } = constructor;

    if (typeof typeName !== 'string') {
      throw new Error('A typeName for your source provider type must be set.');
    }

    if (this.hasSourceProviderType(typeName)) {
      throw new Error('A source provider type with the same name has already been added.');
    }

    if (constructor.__WEBBIT_CLASSNAME__ === 'SourceProvider') {
      this.providerTypes[typeName] = constructor;
    }
  }

  hasSourceProviderType(typeName) {
    return typeName in this.providerTypes;
  }

  hasSourceProvider (providerName) {
    return providerName in this.providers;
  }

  addSourceProvider(providerType, providerName, settings) {

    settings = settings || {};
  
    if (typeof providerName !== 'string') {
      providerName = providerType;
    }
  
    if (!this.hasSourceProviderType(providerType)) {
      throw new Error(`A source provider type with that name hasn't been added.`);
    }
  
    if (this.hasSourceProvider(providerName)) {
      throw new Error('A source provider with that name has already been added.');
    }
  
    const SourceProvider = this.providerTypes[providerType];
  
    this.providers[providerName] = new SourceProvider(this, providerName, {
      ...SourceProvider.settingsDefaults,
      ...settings
    });
  
    this.sourceProviderListeners.forEach(listener => {
      listener(providerName);
    });
    return this.providers[providerName];
  }

  sourceProviderAdded(listener) {
    if (typeof listener !== 'function') {
      throw new Error('listener is not a function');
    }
  
    this.sourceProviderListeners.push(listener);
  }

  removeSourceProvider(providerName) {
    if (!this.hasSourceProvider(providerName)) {
      return;
    }
  
    const provider = this.providers[providerName];
    provider._disconnect();
    delete this.providers[providerName];
  }

  getSourceProvider(providerName) {
    return this.providers[providerName];
  }
  
  getSourceProviderTypeNames() {
    return Object.keys(this.providerTypes);
  }
  
  getSourceProviderNames() {
    return Object.keys(this.providers);
  };

  setDefaultSourceProvider(providerName) {
    this.defaultSourceProvider = providerName;
  
    this.defaultSourceProviderListeners.forEach(listener => {
      listener(this.defaultSourceProvider);
    });
  }

  defaultSourceProviderSet(listener) {
    if (typeof listener !== 'function') {
      throw new Error('listener is not a function');
    }
  
    this.defaultSourceProviderListeners.push(listener);
  }

  getDefaultSourceProvider () {
    return this.defaultSourceProvider;
  }

  getRawSources(providerName) {
    return this.sources.getRawSources(providerName);
  };
  
  getRawSource(providerName, key) {
    return this.sources.getRawSource(providerName, key);
  }
  
  getSources(providerName) {
    return this.sources.getSources(providerName);
  };
  
  getSource(providerName, key) {
    return this.sources.getSource(providerName, key);
  };
  
  subscribe(providerName, key, callback, callImmediately) {
    return this.sources.subscribe(providerName, key, callback, callImmediately);
  };
  
  subscribeAll(providerName, callback, callImmediately) {
    return this.sources.subscribeAll(providerName, callback, callImmediately);
  };

  sourcesChanged(providerName, sourceChanges) {
    return this.sources.sourcesChanged(providerName, sourceChanges);
  }

  clearSources(providerName) {
    return this.sources.clearSources(providerName);
  }
  
  sourcesRemoved(providerName, sourceRemovals) {
    return this.sources.sourcesRemoved(providerName, sourceRemovals);
  }
}

export default Store;
