export const camelCase = new RegExp('^[a-z]+(([0-9])|([A-Z0-9][a-z0-9]+))*([A-Z])?$');
export const kebabCase = new RegExp('^([a-z][a-z0-9]*)(-[a-z0-9]+)*$');
export const typePattern = new RegExp('^(String|Boolean|Number|Array|Object)$');
