 
export default class ConvertToObject {

  static prop2PropValue(value) {
    if (value === null) {
      return null;
    }
    if (value instanceof Object) {
      return value;
    }
    if (typeof value === 'string') {
      try {
        const objectValue = JSON.parse(value);
        return objectValue instanceof Object ? objectValue : {};
      } catch(error) {
        return {};
      }
    }

    return {};
  }

  static prop2AttrValue(value) {
    const objectValue = ConvertToObject.prop2PropValue(value);
    return objectValue === null ? null : JSON.stringify(objectValue);
  }

  static attr2PropValue(value) {
    if (value === null) {
      return null;
    }
    try {
      const objectValue = JSON.parse(value);
      return objectValue instanceof Object ? objectValue : {};
    } catch(error) {
      return {};
    }
  }
}
