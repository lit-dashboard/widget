import { elementSchema } from './schemas';

class Manifest {
  constructor(config) {
    const { value, error } = elementSchema.validate(config);
    if (error) {
      throw new Error(error);
    }
    this.name = value.name;
    this.description = value.description;
    this.attributes = value.attributes;
    this.properties = value.properties;
    this.events = value.events;
    this.slots = value.slots;
    this.cssProperties = value.cssProperties;
    this.cssParts = value.cssParts;
  }
}

export default Manifest;