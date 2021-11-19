/* eslint no-underscore-dangle: off */
import Store from './store';

type SourceUpdate = {
  type: string,
  value?: unknown,
};

type SourceUpdates = {
  [sourceKey: string]: {
    first: SourceUpdate,
    last?: SourceUpdate,
  }
}

type ProviderConstructor = {
  typeName?: string,
  settingsDefaults: Record<string, unknown>
};

abstract class SourceProvider {
  static get __WEBBIT_CLASSNAME__(): string {
    return 'SourceProvider';
  }

  static get typeName(): string | undefined {
    return undefined;
  }

  static get settingsDefaults(): Record<string, unknown> {
    return {};
  }

  private store: Store;
  private _providerName: string;
  public settings: Record<string, unknown>;
  private _sourceUpdates: SourceUpdates;
  private _interval: ReturnType<typeof setInterval>;
  private _clearSourcesTimeoutId?: NodeJS.Timeout

  /**
   * Parent class all source providers must inherit from. Each source provider
   * instance is responsible for maintaining its own state object in the store.
   *
   * @memberof module:@webbitjs/store
   * @abstract
   * @param {string} providerName - The name of the provider.
   */
  constructor(store: Store, providerName: string, settings: Record<string, unknown>) {
    if (new.target === SourceProvider) {
      throw new TypeError('Cannot construct SourceProvider instances directly.');
    }

    if (typeof providerName !== 'string') {
      throw new TypeError("The providerName needs to be passed into super() from your provider's constructor.");
    }

    if (typeof settings === 'undefined') {
      throw new Error("settings must be passed into the super() from your provider's constructor.");
    }

    const constructor = this.constructor as unknown as ProviderConstructor;

    if (typeof constructor.typeName !== 'string') {
      throw new Error('A typeName string must be defined.');
    }

    this.store = store;
    this._providerName = providerName;
    this.settings = {
      ...constructor.settingsDefaults,
      ...settings,
    };
    this._sourceUpdates = {};
    this._interval = setInterval(this._sendUpdates.bind(this), 100);
  }

  /**
   * Updates the value of a source in the store. If the source doesn't
   * exist then it is added. Should only be called internally by the
   * source provider.
   *
   * @protected
   * @param {string} key - The source's key. This is a string separated
   * by '/'.
   * @param {*} value - The new value.
   */
  updateSource(key: string, value: unknown): void {
    clearTimeout(this._clearSourcesTimeoutId);

    if (this._sourceUpdates[key] === undefined) {
      this._sourceUpdates[key] = {
        first: {
          type: 'change',
          value,
        },
      };
    } else {
      this._sourceUpdates[key].last = {
        type: 'change',
        value,
      };
    }
  }

  /**
   * Removes an existing source from the store. If the source
   * doesn't exist this does nothing. Should only be called
   * internally by the source provider.
   *
   * @protected
   * @param {string} key - The source's key. This is a string separated
   * by '/'.
   */
  removeSource(key: string): void {
    if (this._sourceUpdates[key] === undefined) {
      this._sourceUpdates[key] = {
        first: {
          type: 'removal',
        },
      };
    } else {
      this._sourceUpdates[key].last = {
        type: 'removal',
      };
    }
  }

  /**
   * Subscribes to changes for a particular source and all that source's
   * children.
   *
   * @param {string} key - The source's key. This is a string separated
   * by '/'.
   * @param {function} callback - A function that takes in the source's
   * value, key, and key of child source that changed.
   * @param {boolean} callImmediately - If true, the callback is called
   * immediately with the source's current value.
   */
  subscribe(
    key: string,
    callback: (value: unknown, sourceKey: string, childKey: string) => unknown,
    callImmediately: boolean,
  ): unknown {
    return this.store.subscribe(this._providerName, key, callback, callImmediately);
  }

  /**
   * Subscribes to all source changes.
   *
   * @param {function} callback - A function that takes in the source's
   * value, key, and key of child source that changed.
   * @param {boolean} callImmediately - If true, the callback is called
   * immediately with the source's current value.
   */
  subscribeAll(
    callback: (value: unknown, sourceKey: string, childKey: string) => unknown,
    callImmediately: boolean,
  ): unknown {
    return this.store.subscribeAll(this._providerName, callback, callImmediately);
  }

  /**
   * Gets a source's value.
   *
   * @param {string} key - The source's key. This is a string separated
   * by '/'.
   */
  getSource(key: string): unknown {
    return this.store.getSource(this._providerName, key);
  }

  getRawSource(key: string): unknown {
    return this.store.getRawSource(this._providerName, key);
  }

  /**
   * Gets all sources
   */
  getSources(): unknown {
    return this.store.getSources(this._providerName);
  }

  /**
   * Removes all sources in the store for this provider. Should only be
   * called internally by the source provider.
   *
   * @protected
   * @param {function} callback - An optional callback. Called when sources
   * have been cleared.
   */
  clearSources(callback: () => void): void {
    // send updates now to prevent them from being incorrectly sent after
    // sources were cleared.
    this._sendUpdates(() => {
      this.store.clearSources(this._providerName);
      if (typeof callback === 'function') {
        callback();
      }
    });
  }

  /**
   * Removes all sources in the store for this provider after a period of time.
   * If a source is set or this function is called before that period of time
   * ends, sources will not be cleared. This is useful for preventing sources
   * from being cleared on an unreliable network. Should only be called internally
   * by the source provider.
   *
   * @protected
   * @param {number} timeout - The period of time before clearing the sources
   * in milliseconds.
   * @param {function} callback - An optional callback. Called when sources
   * have been cleared.
   */
  clearSourcesWithTimeout(timeout: number, callback: () => void): void {
    clearTimeout(this._clearSourcesTimeoutId);
    this._clearSourcesTimeoutId = setTimeout(() => {
      this.clearSources(callback);
    }, timeout);
  }

  /**
   * Called when a source's value is modified by the user. This method
   * should be overridden by the child class to handle these updates.
   * This method should not be called directly.
   *
   * @protected
   * @param {string} key - The source's key. This is a string separated
   * by '/'.
   * @param {*} value - The source's updated value.
   */
  abstract userUpdate(key: string, value: unknown): void;

  /**
   * Helper function to get the type of a variable represented
   * by a string.
   *
   * @param {*} value
   * @returns {string} - The value's type.
   */
  static getType(value: unknown): string | null {
    if (typeof value === 'string') {
      return 'string';
    } if (typeof value === 'number') {
      return 'number';
    } if (typeof value === 'boolean') {
      return 'boolean';
    } if (value instanceof Array) {
      return 'Array';
    } if (value === null) {
      return 'null';
    }
    return null;
  }

  _disconnect(): void {
    clearTimeout(this._interval);
  }

  _sendUpdates(callback: () => unknown): void {
    if (Object.keys(this._sourceUpdates).length === 0) {
      if (typeof callback === 'function') {
        callback();
      }
      return;
    }
    // send first updates then last
    const firstUpdates = {};
    const lastUpdates = {};

    Object.entries(this._sourceUpdates).forEach(([key, values]) => {
      firstUpdates[key] = values.first;
      if ('last' in values) { lastUpdates[key] = values.last; }
    });

    this._sendChanges(firstUpdates);
    this._sendRemovals(firstUpdates);

    if (Object.keys(lastUpdates).length > 0) {
      setTimeout(() => {
        this._sendChanges(lastUpdates);
        this._sendRemovals(lastUpdates);
        this._sourceUpdates = {};
        if (typeof callback === 'function') {
          callback();
        }
      });
    } else {
      this._sourceUpdates = {};
      if (typeof callback === 'function') {
        callback();
      }
    }
  }

  _sendChanges(updates: { [key: string]: SourceUpdate }): void {
    const changes = {};
    Object.entries(updates).forEach(([key, { type }]) => {
      if (type === 'change') {
        changes[key] = updates[key].value;
      }
    });
    if (Object.keys(changes).length > 0) {
      this.store.sourcesChanged(this._providerName, changes);
    }
  }

  _sendRemovals(updates: { [key: string]: SourceUpdate }): void {
    const removals = [];
    Object.entries(updates).forEach(([key, { type }]) => {
      if (type === 'removal') {
        removals.push(key);
      }
    });
    if (removals.length > 0) {
      this.store.sourcesRemoved(this._providerName, removals);
    }
  }
}

export default SourceProvider;