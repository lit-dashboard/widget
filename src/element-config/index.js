import { normalizeCamelCase, normalizeKebabCase, normalizeType } from './pattern-testers';
import { getDefaultValue, matchesType } from '../util';

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

const normalizeDefaultType = (type, defaultValue) => {
  const value = typeof defaultValue === 'undefined' ? getDefaultValue(type) : defaultValue;
  if (!matchesType(type, value)) {
    throw new Error(`The property's default value does not match its type.`);
  }
  return value;
};

const normalizeStringOrFalse = (value, errorMessage) => {
  if (value === false) {
    return value;
  }
  if (typeof value !== 'string') {
    throw new Error(errorMessage);
  }
  return value;
};

const normalizeChangeEvent = changeEvent =>
  normalizeStringOrFalse(changeEvent, `changeEvent must be false or a string`);

const normalizeDefaultSourceKey = sourceKey =>
  normalizeStringOrFalse(sourceKey, `defaultSourceKey must be false or a string`);

const normalizeDefaultSourceProvider = sourceProvider =>
  normalizeStringOrFalse(sourceProvider, `defaultSourceProvider must be false or a string`);

const normalizeProperty = (name, {
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

  return [
    normalizePropertyName(name),
    {
      description: normalizeDescription(description),
      type: normalizedType,
      defaultValue: normalizedDefaultType,
      attribute: normalizeAttribute(attribute),
      reflect: !!reflect,
      primary: !!primary,
      changeEvent: normalizeChangeEvent(changeEvent),
    }
  ];
};


export const normalizeConfig = ({
  description = '',
  defaultSourceKey = false,
  defaultSourceProvider = false,
  properties = {},
  events = [],
  slots = [],
  cssProperties = [],
  cssParts = [],
} = {}) => ({
  description: normalizeDescription(description),
  defaultSourceKey: normalizeDefaultSourceKey(defaultSourceKey),
  defaultSourceProvider: normalizeDefaultSourceProvider(defaultSourceProvider),
  properties: Object.fromEntries(
    Object.entries(properties)
      .map(([name, property]) => normalizeProperty(name, property))
  ),
  events,
  slots,
  cssProperties,
  cssParts,
});