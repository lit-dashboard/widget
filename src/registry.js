const registered = {};
const webbits = {};
const createdListeners = [];

const registry = {
  define: (name, constructor, options) => {
    if (customElements.get(name)) {
      return;
    }

    if (Object.getPrototypeOf(constructor).name !== 'Webbit') {
      return;
    }

    const webbitProperties = constructor.properties || {};

    for (const propName in webbitProperties) {
      const prop = webbitProperties[propName];
      if (typeof prop.reflect === 'undefined') {
        prop.reflect = true;
      }
    }

    Object.defineProperty(constructor, 'properties', {
      get() {
        return {
          ...webbitProperties,
          sourceProvider: {
            type: String,
            attribute: 'source-provider',
            reflect: true
          },
          sourceKey: {
            type: String,
            attribute: 'source-key',
            reflect: true
          },
          webbitId: {
            type: String,
            attribute: 'webbit-id'
          }
        }
      }
    });

    registered[name] = constructor;
    customElements.define(name, constructor, options);
  },
  whenDefined: (name) => {
    return new Promise((resolve) => {
      customElements.whenDefined(name).then(() => {
        if (name in registered) {
          resolve();
        }
      });
    });
  },
  get: (name) => {
    return registered[name];
  },
  _created: (webbitId, webbit) => {
    webbits[webbitId] = webbit;
    createdListeners.forEach(callback => {
      callback(webbitId, webbit);
    });
  },
  getWebbit: (webbitId) => {
    return webbits[webbitId];
  },
  whenCreated: (listener) => {
    if (typeof listener === 'function') {
      createdListeners.push(listener);
    }
  }
};

window.webbitRegistry = 
  window.webbitRegistry
  || registry;