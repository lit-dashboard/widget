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
}

export default Webbit;