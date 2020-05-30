import { camelToKebab } from './util';

const registered = {};
const webbits = {};
const createdListeners = [];

function isInstanceOfWebbit(constructor) {
  if (!(constructor instanceof Object)) {
    return false;
  }

  return constructor.__WEBBIT_CLASSNAME__ === 'Webbit';
}

const registry = {
  define: (name, constructor, options) => {
    if (customElements.get(name)) {
      return;
    }

    if (!isInstanceOfWebbit(constructor)) {
      return;
    }

    const webbitProperties = constructor.properties || {};

    for (const propName in webbitProperties) {
      const prop = webbitProperties[propName];
      if (typeof prop.reflect === 'undefined') {
        prop.reflect = true;
      }
      if (typeof prop.attribute === 'undefined') {
        prop.attribute = camelToKebab(propName);
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
  getRegisteredNames: () => {
    return Object.keys(registered);
  },
  _generateWebbitId: (webbit, desiredId) => {

    const baseName = desiredId ? desiredId : webbit.nodeName.toLowerCase();

    if (typeof webbits[baseName] === 'undefined') {
      return baseName;
    }
    const webbitCount = Object.keys(webbits).length;
    for (let i = 0; i < webbitCount; i++) {
      const id = `${baseName} #${i+2}`;
      if (typeof webbits[id] === 'undefined') {
        return id;
      }
    }

    return null;
  },
  _created: (webbitId, webbit) => {

    if (typeof webbitId !== 'string' || webbitId.length === 0) {
      throw new Error(`Webbit ID '${webbitId}' is not a string of length 1 or more characters`);
    }

    if (webbitId in webbits) {
      throw new Error(`Webbit with ID '${webbitId}' has already been created.`);
    }

    webbits[webbitId] = webbit;
    createdListeners.forEach(callback => {
      callback(webbitId, webbit);
    });
  },
  getWebbit: (webbitId) => {
    return webbits[webbitId];
  },
  hasWebbit: (webbitId) => {
    return webbitId in webbits;
  },
  getWebbitIds: () => {
    return Object.keys(webbits);
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