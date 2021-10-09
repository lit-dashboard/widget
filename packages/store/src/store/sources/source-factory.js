
export class Source {
  static get __WEBBIT_CLASSNAME__() {
    return 'Source';
  }
}

export const isSourceType = (value) => {
  return value instanceof Object && value.constructor.__WEBBIT_CLASSNAME__ === 'Source';
};

export const createRawSource = () => {
  return {
    __normalizedKey__: undefined,
    __fromProvider__: false,
    __key__: undefined,
    __value__: undefined,
    __sources__: {}
  };
};

export const createSource = () => {
  return {
    getterValues: {},
    setters: {},
    sources: {}
  };
};