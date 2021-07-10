import { getValueFromAttribute, setAttributeFromValue, isEqual } from './util';

class PropertyHandler {

  get value() {
    const { reflect, attribute, name, type } = this._property;

    if (attribute && reflect) {
      return getValueFromAttribute(this._element, attribute, type);
    } else if (name in this._element) {
      return this._element[name];
    } else {
      return getValueFromAttribute(this._element, attribute, type);
    }
  }

  set value(value) {
    const { attribute, name } = this._property;

    if (attribute) {
      setAttributeFromValue(this._element, attribute, value);
    } else if (!isEqual(this._element[name], value)) {
      this._element[name] = value;
    }
  }

  constructor(element, property) {
    this._element = element;
    this._property = property;
    this._connected = false;
    this._defaultValue = this._property.defaultValue;
    this._subscribers = [];
    this._propertyObserver = this._getPropertyObserver();
  }

  _getPropertyObserver() {
    const { changeEvent, attribute } = this._property;

    if (changeEvent) {
      const listener = () => {
        this._notifySubscribers();
      };
      return {
        connect: () => {
          this._element.addEventListener(changeEvent, listener, false);
        },
        disconnect: () => {
          this._element.removeEventListener(changeEvent, listener, false);
        }
      }
    } else if (attribute) {
      const observer = new MutationObserver(() => {
        this._notifySubscribers();
      });
  
      return {
        connect: () => {
          observer.observe(this._element, {
            attributes: true,
            attributeFilter: [attribute]
          });
        },
        disconnect: () => {
          observer.disconnect();
        },
      };
    } else {
      return { connect() {}, disconnect() {} };
    }
  }

  connect() {
    if (!this._connected) {
      const currentValue = this.value;
      this._defaultValue = typeof currentValue !== 'undefined' 
        ? currentValue 
        : this._property.defaultValue;
      this._propertyObserver.connect();
      this._connected = true;
    }
  }

  disconnect() {
    if (this._connected) {
      this._connected = false;
      this._propertyObserver.disconnect();
      this._setToDefault();
    }
  }

  update(value) {
    this.connect();
    this.value = value;
  }

  subscribe(callback) {
    this._subscribers.push(callback);
  }

  _notifySubscribers() {
    const value = this.value;
    this._subscribers.forEach(subscriber => {
      subscriber(value);
    });
  }

  _setToDefault() {
    this.value = this._defaultValue;
  }
}

export default PropertyHandler;