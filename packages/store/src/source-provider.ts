import { noop } from './util';

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

class SourceProvider {
  #interval = setInterval(this.#sendUpdates.bind(this), 100);
  #sourceUpdates: SourceUpdates = {};
  #clearSourcesTimeoutId?: NodeJS.Timeout;
  #clearSourcesHandlers: Map<symbol, () => void> = new Map();
  #sourcesChangedHandlers: Map<symbol, (changes: Record<string, unknown>) => void> = new Map();
  #sourcesRemovedHandlers: Map<symbol, (removals: Array<string>) => void> = new Map();

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
    clearTimeout(this.#clearSourcesTimeoutId);

    if (this.#sourceUpdates[key] === undefined) {
      this.#sourceUpdates[key] = {
        first: {
          type: 'change',
          value,
        },
      };
    } else {
      this.#sourceUpdates[key].last = {
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
    if (this.#sourceUpdates[key] === undefined) {
      this.#sourceUpdates[key] = {
        first: {
          type: 'removal',
        },
      };
    } else {
      this.#sourceUpdates[key].last = {
        type: 'removal',
      };
    }
  }

  /**
   * Removes all sources in the store for this provider. Should only be
   * called internally by the source provider.
   *
   * @protected
   * @param {function} callback - An optional callback. Called when sources
   * have been cleared.
   */
  clearSources(callback: () => void = noop): void {
    // send updates now to prevent them from being incorrectly sent after
    // sources were cleared.
    this.#sendUpdates(() => {
      this.#clearSourcesHandlers.forEach(listener => listener());
      callback();
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
    clearTimeout(this.#clearSourcesTimeoutId);
    this.#clearSourcesTimeoutId = setTimeout(() => {
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
  userUpdate(key: string, value: unknown): void {
    this.updateSource(key, value);
  }

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

  #sendUpdates(callback: () => unknown = noop): void {
    if (Object.keys(this.#sourceUpdates).length === 0) {
      callback();
      return;
    }
    // send first updates then last
    const firstUpdates = {};
    const lastUpdates = {};

    Object.entries(this.#sourceUpdates).forEach(([key, values]) => {
      firstUpdates[key] = values.first;
      if ('last' in values) { lastUpdates[key] = values.last; }
    });

    this.#sendChanges(firstUpdates);
    this.#sendRemovals(firstUpdates);

    if (Object.keys(lastUpdates).length > 0) {
      setTimeout(() => {
        this.#sendChanges(lastUpdates);
        this.#sendRemovals(lastUpdates);
        this.#sourceUpdates = {};
        callback();
      });
    } else {
      this.#sourceUpdates = {};
      callback();
    }
  }

  #sendChanges(updates: { [key: string]: SourceUpdate }): void {
    const changes: Record<string, unknown> = {};
    Object.entries(updates).forEach(([key, { type }]) => {
      if (type === 'change') {
        changes[key] = updates[key].value;
      }
    });
    if (Object.keys(changes).length > 0) {
      this.#sourcesChangedHandlers.forEach(listener => listener(changes));
    }
  }

  #sendRemovals(updates: { [key: string]: SourceUpdate }): void {
    const removals: Array<string> = [];
    Object.entries(updates).forEach(([key, { type }]) => {
      if (type === 'removal') {
        removals.push(key);
      }
    });
    if (removals.length > 0) {
      this.#sourcesRemovedHandlers.forEach(listener => listener(removals));
    }
  }

  addClearSourcesHandler(handler: () => unknown): () => void {
    const symbol = Symbol('clearSources');
    this.#clearSourcesHandlers.set(symbol, handler);
    return () => {
      this.#clearSourcesHandlers.delete(symbol);
    };
  }

  addSourcesChangedHandler(handler: (changes: Record<string, unknown>) => void): () => void {
    const symbol = Symbol('sourcesChanged');
    this.#sourcesChangedHandlers.set(symbol, handler);
    return () => {
      this.#sourcesChangedHandlers.delete(symbol);
    };
  }

  addSourcesRemovedHandler(handler: (removals: Array<string>) => void): () => void {
    const symbol = Symbol('sourcesRemoved');
    this.#sourcesRemovedHandlers.set(symbol, handler);
    return () => {
      this.#sourcesRemovedHandlers.delete(symbol);
    };
  }

  disconnect(): void {
    clearTimeout(this.#interval);
  }
}

export default SourceProvider;