import isPlainObject from "./isplainobject";


/**
 * Turns a camelCase string to kebab-case
 * 
 * https://gist.github.com/nblackburn/875e6ff75bc8ce171c758bf75f304707#gistcomment-2993938
 *
 * @param {string} string 
 */
export const camelToKebab = (string) => {
  return string
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
    .toLowerCase();
};

export const isSourceObject = (value) => {
  return (
    value instanceof Object
    && value !== null
    && value.constructor.__WEBBIT_CLASSNAME__ === 'Source'
  );
};

export const getValueType = value => {
  if (typeof value === 'string') {
    return 'String';
  } else if (typeof value === 'number') {
    return 'Number';
  } else if (typeof value === 'boolean') {
    return 'Boolean';
  } else if (value instanceof Array) {
    return 'Array';
  } else if (isPlainObject(value)) {
    return 'Object';
  }
  return null;
}

export const getDefaultValue = type => {
  const defaultValues = {
    'String': '',
    'Number': 0,
    'Boolean': false,
    'Array': [],
    'Object': {}
  };
  return defaultValues[type];
}

export const matchesType = (type, value) => {
  switch (type) {
    case 'String': return typeof value === 'string';
    case 'Number': return typeof value === 'number';
    case 'Boolean': return typeof value === 'boolean';
    case 'Array': return value instanceof Array;
    case 'Object': return isPlainObject(value);
  }
  return false;
};