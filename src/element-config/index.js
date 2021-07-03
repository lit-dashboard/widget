import { normalizeCamelCase, normalizeKebabCase, normalizeType } from './pattern-testers';
import isPlainObject from '../isplainobject';

const defaultValues = {
  'String': '',
  'Number': 0,
  'Boolean': false,
  'Array': [],
  'Object': {}
};

const normalizeElementName = name => normalizeKebabCase(name, 'element name');

const normalizeAttribute = attribute => {
  if (attribute === false) {
    return attribute;
  }
  return normalizeKebabCase(attribute, `property's attribute`);
};

const normalizePropertyName = name => normalizeCamelCase(name, `property's name`);

const normalizeDescription = description => {
  return typeof description === 'string' ? description : '';
};

const normalizePropertyType = type => normalizeType(type, `property's type`);

const matchesType = (type, value) => {
  switch (type) {
    case 'String': return typeof value === 'string';
    case 'Number': return typeof value === 'number';
    case 'Boolean': return typeof value === 'boolean';
    case 'Array': return value instanceof Array;
    case 'Object': return isPlainObject(value);
  }
  return false;
};

const normalizeDefaultType = (type, defaultValue) => {
  const value = typeof defaultValue === 'undefined' ? defaultValues[type] : defaultValue;
  if (!matchesType(type, value)) {
    throw new Error(`The property's default value does not match its type.`);
  }
  return value;
};

const normalizeProperty = ({
  name,
  description = '',
  type = 'String',
  defaultValue,
  attribute = false,
  reflect = false,
  primary = false,
  changeEvent = false,
} = {}) => {

  const normalizedType = normalizePropertyType(type);
  const normalizedDefaultType = normalizeDefaultType(normalizedType, defaultValue); 

  return {
    name: normalizePropertyName(name),
    description: normalizeDescription(description),
    type: normalizedType,
    defaultValue: normalizedDefaultType,
    attribute: normalizeAttribute(attribute),
    reflect: !!reflect,
    primary: !!primary,
    changeEvent,
  };
};


export const normalizeConfig = ({
  name,
  description = '',
  properties = [],
  events = [],
  slots = [],
  cssProperties = [],
  cssParts = [],
} = {}) => ({
  name: normalizeElementName(name),
  description: normalizeDescription(description),
  properties: properties.map(normalizeProperty),
  events,
  slots,
  cssProperties,
  cssParts,
});