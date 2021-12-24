
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

export const getValueType = value => {
  if (typeof value === 'string') {
    return 'String';
  } else if (typeof value === 'number') {
    return 'Number';
  } else if (typeof value === 'boolean') {
    return 'Boolean';
  } else if (value instanceof Array) {
    return 'Array';
  } else if (value instanceof Object) {
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
    case 'Object': return value instanceof Object;
  }
  return false;
};

export const convertValue = (value, type) => {
  switch (type) {
    case 'String':
      return value?.toString() || '';
    case 'Number':
      const numberValue = parseFloat(value);
      return isNaN(numberValue) ? 0 : numberValue;
    case 'Boolean':
      return !!value;
    case 'Array':
      if (value instanceof Array) {
        return value;
      } else if (typeof value === 'string') {
        try {
          const arrayValue = JSON.parse(value);
          return arrayValue instanceof Array ? arrayValue : [];
        } catch(e) {
          return [];
        }
      } else {
        return [];
      }
    case 'Object':
      if (value instanceof Object) {
        return value;
      } else {
        try {
          return JSON.parse(value);
        } catch(e) {
          return {};
        }
      }
    default:
      return '';
  }
};

const setAttribute = (element, attribute, value) => {
  if (element.getAttribute(attribute) != value) {
    element.setAttribute(attribute, value);
  }
};

const removeAttribute = (element, attribute) => {
  if (element.hasAttribute(attribute)) {
    element.removeAttribute(attribute);
  }
}

export const setAttributeFromValue = (element, attribute, value) => {
  if (typeof value === 'string') {
    setAttribute(element, attribute, value);
  } else if (typeof value === 'number') {
    if (isNaN(value)) {
      removeAttribute(element, attribute);
    } else {
      setAttribute(element, attribute, value);
    }
  } else if (typeof value === 'boolean') {
    if (value) {
      setAttribute(element, attribute, '');
    } else {
      removeAttribute(element, attribute);
    }
  } else if (value instanceof Array || value instanceof Object) {
    setAttribute(element, attribute, JSON.stringify(value));
  }
}

export const getValueFromAttribute = (element, attribute, type) => {
  const attributeValue = element.getAttribute(attribute);
  if (type === 'Boolean') {
    return attributeValue !== null;
  }
  return convertValue(attributeValue, type);
};

export const isEqual = (a, b) => {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (a instanceof Array && b instanceof Array) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
  return false;
};

export const setAttributeValue = (element, attributeName, value) => {
  if (value === null) {
    element.removeAttribute(attributeName);
  } else {
    element.setAttribute(attributeName, value);
  }
}

export function noop() {}