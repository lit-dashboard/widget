 
export default class ConvertToNumber {

  static prop2PropValue(value) {
    return value === null ? null : parseFloat(value);
  }

  static prop2AttrValue(value) {
    return value === null ? null : parseFloat(value).toString();
  }

  static attr2PropValue(value, attrType) {
    return value === null ? null : parseFloat(value);
  }
}