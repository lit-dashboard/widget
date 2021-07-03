import { normalizeConfig } from './element-config';

class Webbit {

  constructor(store, elementConfigs = []) {
    this.store = store;
    this.elementConfigs = new Map();
    elementConfigs.forEach(config => {
      this.elementConfigs.set(config.name, normalizeConfig(config));
    });
  }

  connect(element) {

  }

  connectChildren(element) {

  }

  getElementConfig(name) {
    return this.elementConfigs.get(name);
  }

  hasElementConfig(name) {
    return this.elementConfigs.has(name);
  }
}

export default Webbit;