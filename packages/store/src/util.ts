import camelCase from './camel-case';

export const normalizeKey = (key: string): string => key
  .split('/')
  .map(keyPart => camelCase(keyPart))
  .join('/');

export default normalizeKey;