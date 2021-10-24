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

const normalizePropertyType = type => {
  return normalizeType(
    typeof type === 'function' ? type.name : type,
    `property's type`
  );
}

const normalizeDefaultType = (type, defaultValue) => {
  const value = typeof defaultValue === 'undefined' ? getDefaultValue(type) : defaultValue;
  if (!matchesType(type, value)) {
    throw new Error(`The property's default value does not match its type.`);
  }
  return value;
};

const normalizeStringOrUndefined = (value, errorMessage) => {
  if (value === undefined) {
    return value;
  }
  if (typeof value !== 'string') {
    throw new Error(errorMessage);
  }
  return value;
};

const normalizeChangeEvent = changeEvent =>
  normalizeStringOrUndefined(changeEvent, `changeEvent must be false or a string`);

const normalizeDefaultSourceKey = sourceKey =>
  normalizeStringOrUndefined(sourceKey, `defaultSourceKey must be false or a string`);

const normalizeDefaultSourceProvider = sourceProvider =>
  normalizeStringOrUndefined(sourceProvider, `defaultSourceProvider must be false or a string`);

const normalizeProperty = (name, {
  property = normalizePropertyName(name),
  description = '',
  type = 'String',
  defaultValue,
  attribute = name.toLowerCase(),
  reflect = false,
  primary = false,
  changeEvent = 'change',
} = {}) => {
  const normalizedType = normalizePropertyType(type);
  const normalizedDefaultType = normalizeDefaultType(normalizedType, defaultValue);

  return [
    normalizePropertyName(name),
    {
      property,
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
  defaultSourceKey = undefined,
  defaultSourceProvider = undefined,
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