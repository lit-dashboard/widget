 
export default class ConvertToBoolean {

  static prop2PropValue(value) {
    return value === null ? null : !!value;
  }

  static prop2AttrValue(value) {
    return !!value ? '' : null;
  }

  static attr2PropValue(value) {
    return value !== null;
  }
}