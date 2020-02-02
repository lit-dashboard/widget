function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

import { LitElement } from 'lit-element';
import { isNull, forEach, isPlainObject } from 'lodash';
import { hasSourceManager, getSourceManager, getSourceProvider } from '@lit-dashboard/store';
export default class Webbit extends LitElement {
  constructor() {
    super();
    forEach(this.constructor.properties, (property, name) => {
      if (['sourceProvider', 'sourceKey', 'webbitId'].includes(name)) {
        return;
      }

      var {
        type,
        attribute,
        reflect,
        structure
      } = property;

      if (attribute === false || !reflect) {
        return;
      }

      Object.defineProperty(this, name, {
        get() {
          var getter = this.constructor.properties[name].get;

          if (typeof getter === 'function') {
            return getter.bind(this)();
          }

          return this["_".concat(name)];
        },

        set(value) {
          var sourceProvider = getSourceProvider(this.sourceProvider);

          if (isPlainObject(value) && value.__fromSource__) {
            var _oldValue = this._value;
            this["_".concat(name)] = value.__value__;
            this.requestUpdate(name, _oldValue);

            this._dispatchPropertyChange(name, _oldValue, value.__value__);

            return;
          } else if (typeof this.sourceKey === 'string' && sourceProvider) {
            var source = this.sourceManager.getSource(this.sourceKey);

            if (source) {
              var propSource = source.__sources__[name];

              if (typeof propSource === 'undefined') {
                if (this.constructor.properties[name].primary && source.__fromProvider__) {
                  sourceProvider.updateFromDashboard(this.sourceKey, value);
                  return;
                }
              } else if (propSource.__fromProvider__) {
                sourceProvider.updateFromDashboard(propSource.__key__, value);
                return;
              }
            }
          }

          var oldValue = this._value;
          this["_".concat(name)] = value;
          this.requestUpdate(name, oldValue);

          this._dispatchPropertyChange(name, oldValue, value);
        }

      });
    });
    Object.defineProperty(this, 'sourceProvider', {
      get() {
        return this._sourceProvider;
      },

      set(value) {
        if (hasSourceManager(value)) {
          var oldValue = this._sourceProvider;
          this._sourceProvider = value;
          this.sourceManager = getSourceManager(value);
          this.requestUpdate('sourceProvider', oldValue);

          this._dispatchSourceProviderChange();

          if (this._unsubscribeSource) {
            this._unsubscribeSource();
          }

          this.sourceKey = this.sourceKey;
        }
      }

    });
    Object.defineProperty(this, 'sourceKey', {
      get() {
        return this._sourceKey;
      },

      set(value) {
        if (isNull(value) || isNull(this.sourceManager)) {
          return;
        }

        if (this._unsubscribeSource) {
          this._unsubscribeSource();
        }

        var oldValue = this._sourceKey;
        this._sourceKey = value;
        this.requestUpdate('sourceKey', oldValue);

        this._dispatchSourceKeyChange();

        this._unsubscribeSource = this.sourceManager.subscribe(value, source => {
          if (typeof source !== 'undefined') {
            this._setPropsFromSource(source);
          }
        }, true);
      }

    });
    this.sourceProvider = null;
    this.sourceManager = null;
    this.sourceKey = null;
    this._unsubscribeSource = null;

    this._addToRegistry();

    var resizeObserver = new ResizeObserver(() => {
      this.resized();
    });
    resizeObserver.observe(this);
  }

  _addToRegistry() {
    var _this = this;

    return _asyncToGenerator(function* () {
      yield _this.updateComplete;

      var webbitId = _this.getAttribute('webbit-id');

      window.webbitRegistry._created(webbitId, _this);
    })();
  }

  _dispatchSourceKeyChange() {
    var event = new CustomEvent('source-key-change', {
      detail: {
        sourceKey: this.sourceKey
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  _dispatchPropertyChange(property, oldValue, newValue) {
    var event = new CustomEvent('property-change', {
      detail: {
        property,
        oldValue,
        newValue
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  _dispatchSourceProviderChange() {
    var event = new CustomEvent('source-provider-change', {
      detail: {
        sourceProvider: this.sourceProvider
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  _dispatchSourceAdded() {
    var webbitId = this.getAttribute('webbit-id');
    var event = new CustomEvent('source-add', {
      detail: {
        webbitId
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  _setPropsFromSource(source) {
    forEach(this.constructor.properties, (property, name) => {
      if (['sourceProvider', 'sourceKey', 'webbitId'].includes(name)) {
        return;
      }

      var {
        type,
        attribute,
        reflect,
        structure,
        primary
      } = property;

      if (attribute === false || !reflect) {
        return;
      }

      var propSource = source[name];

      if (typeof propSource === 'undefined') {
        if (primary) {
          this[name] = {
            __fromSource__: true,
            __value__: source
          };
        }
      } else {
        this[name] = {
          __fromSource__: true,
          __value__: propSource
        };
      }
    });
  }

  hasSource() {
    return !isNull(this.sourceKey) && typeof this.sourceKey !== 'undefined';
  }

  resized() {}

}