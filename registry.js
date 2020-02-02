function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var registered = {};
var webbits = {};
var createdListeners = [];
var registry = {
  define: (name, constructor, options) => {
    if (customElements.get(name)) {
      return;
    }

    if (Object.getPrototypeOf(constructor).name !== 'Webbit') {
      return;
    }

    var webbitProperties = constructor.properties || {};

    for (var propName in webbitProperties) {
      var prop = webbitProperties[propName];

      if (typeof prop.reflect === 'undefined') {
        prop.reflect = true;
      }
    }

    Object.defineProperty(constructor, 'properties', {
      get() {
        return _objectSpread({}, webbitProperties, {
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
        });
      }

    });
    registered[name] = constructor;
    customElements.define(name, constructor, options);
  },
  whenDefined: name => {
    return new Promise(resolve => {
      customElements.whenDefined(name).then(() => {
        if (name in registered) {
          resolve();
        }
      });
    });
  },
  get: name => {
    return registered[name];
  },
  _created: (webbitId, webbit) => {
    webbits[webbitId] = webbit;
    createdListeners.forEach(callback => {
      callback(webbitId, webbit);
    });
  },
  getWebbit: webbitId => {
    return webbits[webbitId];
  },
  whenCreated: listener => {
    if (typeof listener === 'function') {
      createdListeners.push(listener);
    }
  }
};
window.webbitRegistry = window.webbitRegistry || registry;