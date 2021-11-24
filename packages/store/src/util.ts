/* eslint @typescript-eslint/no-empty-function: off */
import camelCase from './camel-case';

export const noop: () => unknown = () => {};

export const normalizeKey = (key: string): string => key
  .split('/')
  .map(keyPart => camelCase(keyPart))
  .join('/');

export default normalizeKey;