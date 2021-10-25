import ConvertToArray from "./convert-to-array";
import ConvertToBoolean from "./convert-to-boolean";
import ConvertToNumber from "./convert-to-number";
import ConvertToObject from "./convert-to-object";
import ConvertToString from "./convert-to-string";

const converters = {
  Array: ConvertToArray,
  Boolean: ConvertToBoolean,
  Number: ConvertToNumber,
  Object: ConvertToObject,
  String: ConvertToString
};

export const prop2PropValue = (value, type) => {
  return converters[type]?.prop2PropValue(value) ?? null;
};

export const prop2AttrValue = (value, type) => {
  return converters[type]?.prop2AttrValue(value) ?? null;
};

export const attr2PropValue = (value, type) => {
  return converters[type]?.attr2PropValue(value) ?? null;
};
