 
export default class ConvertToArray {

  static prop2PropValue(value) {
    if (value === null) {
      return null;
    }
    if (value instanceof Array) {
      return value;
    }
    if (typeof value === 'string') {
      try {
        const arrayValue = JSON.parse(value);
        return arrayValue instanceof Array ? arrayValue : [];
      } catch(error) {
        return [];
      }
    }

    return [];
  }

  static prop2AttrValue(value) {
    const arrayValue = ConvertToArray.prop2PropValue(value);
    return arrayValue === null ? null : JSON.stringify(arrayValue);
  }

  static attr2PropValue(value) {
    if (value === null) {
      return null;
    }
    try {
      const arrayValue = JSON.parse(value);
      return arrayValue instanceof Array ? arrayValue : [];
    } catch(error) {
      return [];
    }
  }
}
