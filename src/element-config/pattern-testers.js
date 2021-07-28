import { camelCase, kebabCase, typePattern } from "./patterns";
import { camelCaseError, kebabCaseError, typeError } from './error-messages';

export const normalizeCamelCase = (name, errorType) => {
  if (typeof name !== 'string' || !camelCase.test(name)) {
    throw new Error(camelCaseError(errorType));
  }
  return name;
};

export const normalizeKebabCase = (name, errorType) => {
  if (typeof name !== 'string' || !kebabCase.test(name)) {
    throw new Error(kebabCaseError(errorType));
  }
  return name;
};

export const normalizeType = (type, errorType) => {
  if (!typePattern.test(type)) {
    throw new Error(typeError(errorType));
  }
  return type;
};