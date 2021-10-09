 
export default class ConvertToString {

  static prop2PropValue(value) {
    return value === null ? null : (value?.toString() || '');
  }

  static prop2AttrValue(value) {
    return value === null ? null : (value?.toString() || '');
  }

  static attr2PropValue(value, attrType) {
    return value === null ? null : value;
  }
}