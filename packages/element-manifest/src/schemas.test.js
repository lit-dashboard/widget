import Joi from 'joi';

import {
  attributesSchema,
  camelCaseSchema,
  cssPropertiesSchema,
  cssPropertyNameSchema,
  defaultValueSchema,
  elementSchema,
  kebabCaseSchema,
  nameWithDescriptionSchema,
  optionalStringSchema,
  propertiesSchema,
  typeSchema
} from './schemas';

const testDefaultValueSchema = Joi.object({
  type: typeSchema,
  defaultValue: defaultValueSchema,
});

describe('schemas', () => {
  describe('typeSchema', () => {
    it('accepts valid types', async () => {
      for (let type of ['String', 'Boolean', 'Number', 'Array', 'Object']) {
        expect(await typeSchema.validateAsync(type)).toBe(type);
      }
    });

    it(`doesn't accept invalid types`, async () => {
      await expect(typeSchema.validateAsync('Hotdog')).rejects.toThrow();
    });
  });

  describe(`kebabCaseSchema`, () => {
    it(`accepts strings in the correct format`, async () => {
      expect(await kebabCaseSchema.validateAsync('kebab-case')).toBe('kebab-case');
      expect(await kebabCaseSchema.validateAsync('kebabcase')).toBe('kebabcase');
      expect(await kebabCaseSchema.validateAsync('ke-bab-case')).toBe('ke-bab-case');
    });

    it(`doesn't accept strings that aren't kebab case`, async () => {
      await expect(kebabCaseSchema.validateAsync('camelCase')).rejects.toThrow();
      await expect(kebabCaseSchema.validateAsync('Some-other-case')).rejects.toThrow();
      await expect(kebabCaseSchema.validateAsync('snake_case')).rejects.toThrow();
    });
  });

  describe(`camelCaseSchema`, () => {
    it(`accepts strings in the correct format`, async () => {
      expect(await camelCaseSchema.validateAsync('camelCase')).toBe('camelCase');
      expect(await camelCaseSchema.validateAsync('camelcase')).toBe('camelcase');
      expect(await camelCaseSchema.validateAsync('camElCase')).toBe('camElCase');
    });

    it(`doesn't accept strings that aren't camel case`, async () => {
      await expect(camelCaseSchema.validateAsync('kebab-case')).rejects.toThrow();
      await expect(camelCaseSchema.validateAsync('PascalCase')).rejects.toThrow();
      await expect(camelCaseSchema.validateAsync('snake_case')).rejects.toThrow();
    });
  });

  describe(`cssPropertyNameSchema`, () => {
    it(`accepts strings in the correct format`, async () => {
      expect(await cssPropertyNameSchema.validateAsync('--property')).toBe('--property');
      expect(await cssPropertyNameSchema.validateAsync('--another-property')).toBe('--another-property');
      expect(await cssPropertyNameSchema.validateAsync('--yet-another-property')).toBe('--yet-another-property');
    });

    it(`doesn't accept strings that aren't in the correct format`, async () => {
      await expect(cssPropertyNameSchema.validateAsync('--')).rejects.toThrow();
      await expect(cssPropertyNameSchema.validateAsync('---property')).rejects.toThrow();
      await expect(cssPropertyNameSchema.validateAsync('--Property')).rejects.toThrow();
      await expect(cssPropertyNameSchema.validateAsync('--another property')).rejects.toThrow();
      await expect(cssPropertyNameSchema.validateAsync('--another--property')).rejects.toThrow();
      await expect(cssPropertyNameSchema.validateAsync('--another-property3')).rejects.toThrow();
    });
  });

  describe('optionalStringSchema', () => {
    it(`accepts strings`, async () => {
      expect(await optionalStringSchema.validateAsync("")).toBe("");
      expect(await optionalStringSchema.validateAsync("some string")).toBe("some string");
    });

    it(`sets value to default if undefined`, async() => {
      expect(await optionalStringSchema.validateAsync()).toBe("");
    });

    it(`doesn't accept non-strings`, async () => {
      await expect(optionalStringSchema.validateAsync(0)).rejects.toThrow();
    });
  });

  describe(`defaultValueSchema`, () => {
    it(`accepts strings when type is 'String'`, async () => {
      expect(
        await testDefaultValueSchema.validateAsync({ type: 'String', defaultValue: 'some value' })
      ).toEqual({ type: 'String', defaultValue: 'some value' })

      expect(
        await testDefaultValueSchema.validateAsync({ type: 'String' })
      ).toEqual({ type: 'String', defaultValue: '' })
    });

    it(`doesn't accept strings when type is not 'String'`, async () => {
      await expect(
        testDefaultValueSchema.validateAsync({ type: 'Boolean', defaultValue: 'some value' })
      ).rejects.toThrow();
    });

    it(`accepts booleans when type is 'Boolean'`, async () => {
      expect(
        await testDefaultValueSchema.validateAsync({ type: 'Boolean', defaultValue: true })
      ).toEqual({ type: 'Boolean', defaultValue: true })

      expect(
        await testDefaultValueSchema.validateAsync({ type: 'Boolean' })
      ).toEqual({ type: 'Boolean', defaultValue: false })
    });

    it(`doesn't accept booleans when type is not 'Boolean'`, async () => {
      await expect(
        testDefaultValueSchema.validateAsync({ type: 'Number', defaultValue: false })
      ).rejects.toThrow();
    });
  });

  describe(`nameWithDescriptionSchema`, () => {
    it(`accepts an array of objects with a name property of type'String' and optionally a description of type 'String'`, async () => {
      const values = [
        { name: 'name' }, 
        { name: 'other name', description: 'description' }
      ];
      const expected = [
        { name: 'name', description: '' }, 
        { name: 'other name', description: 'description' }
      ];
      expect(
        await nameWithDescriptionSchema.validateAsync(values)
      ).toEqual(expected);
    });

    it(`doesn't accept names and descriptions that aren't of type 'String'`, async () => {
      await expect(
        testDefaultValueSchema.validateAsync([{ name: 3 }])
      ).rejects.toThrow();

      await expect(
        testDefaultValueSchema.validateAsync([{ name: 'name', description: false }])
      ).rejects.toThrow();
    });

    it(`doesn't accept objects without name properties`, async () => {
      await expect(
        testDefaultValueSchema.validateAsync([{ description: 'description' }])
      ).rejects.toThrow();
    });

    it(`doesn't values that aren't of type 'Array'`, async () => {
      await expect(
        testDefaultValueSchema.validateAsync({ name: 3 })
      ).rejects.toThrow();
    });
  });

  describe(`attributesSchema`, () => {
    it(`accepts an array of objects with required name and type properties and optional description and defaultValue properties`, async () => {
      const values = [
        { name: 'name', type: 'Boolean' }, 
        { name: 'name2', type: 'Number', description: 'description', defaultValue: 4 },
        { name: 'name3', type: 'String' }, 
      ];
      const expected = [
        { name: 'name', type: 'Boolean', description: '', defaultValue: false }, 
        { name: 'name2', type: 'Number', description: 'description', defaultValue: 4 },
        { name: 'name3', type: 'String', description: '', defaultValue: '' }, 
      ];
      expect(
        await attributesSchema.validateAsync(values)
      ).toEqual(expected);
    });

    it(`doesn't accept properties with incorrect types`, async () => {
      await expect(
        attributesSchema.validateAsync([{ name: 'name', type: 'Boolean', defaultValue: 0 }])
      ).rejects.toThrow();

      await expect(
        attributesSchema.validateAsync([{ name: 'name', type: 'Boolean', description: false }])
      ).rejects.toThrow();

      await expect(
        attributesSchema.validateAsync([{ name: 'name', type: 'Moose' }])
      ).rejects.toThrow();

      await expect(
        attributesSchema.validateAsync([{ name: 3, type: 'Boolean' }])
      ).rejects.toThrow();
    });

    it(`doesn't accept objects without required properties`, async () => {
      await expect(
        attributesSchema.validateAsync([{ name: 'name' }])
      ).rejects.toThrow();

      await expect(
        attributesSchema.validateAsync([{ type: 'Boolean' }])
      ).rejects.toThrow();
    });

    it(`doesn't values that aren't of type 'Array'`, async () => {
      await expect(
        attributesSchema.validateAsync({ name: 'name', type: 'Boolean' })
      ).rejects.toThrow();
    });
  });

  describe(`propertiesSchema`, () => {
    it(`accepts an array of objects with required name and type properties and optional description, defaultValue, attribute, reflect, primary and changeEvent properties`, async () => {
      const values = [
        { name: 'name', type: 'Boolean' }, 
        { name: 'name2', type: 'Number', description: 'description', defaultValue: 3, attribute: 'name2', reflect: true, primary: true, changeEvent: 'nameChange' }
      ];
      const expected = [
        { name: 'name', type: 'Boolean', description: '', defaultValue: false, attribute: false, reflect: false, primary: false, changeEvent: false }, 
        { name: 'name2', type: 'Number', description: 'description', defaultValue: 3, attribute: 'name2', reflect: true, primary: true, changeEvent: 'nameChange' }
      ];
      expect(
        await propertiesSchema.validateAsync(values)
      ).toEqual(expected);
    });

    it(`doesn't accept properties with incorrect types`, async () => {
      await expect(
        propertiesSchema.validateAsync([{ name: 'name', type: 'Boolean', description: 3 }])
      ).rejects.toThrow();

      await expect(
        propertiesSchema.validateAsync([{ name: 'name', type: 'Boolean', defaultValue: 3 }])
      ).rejects.toThrow();

      await expect(
        propertiesSchema.validateAsync([{ name: 'name', type: 'Boolean', attribute: 3 }])
      ).rejects.toThrow();

      await expect(
        propertiesSchema.validateAsync([{ name: 'name', type: 'Boolean', attribute: true }])
      ).rejects.toThrow();

      await expect(
        propertiesSchema.validateAsync([{ name: 'name', type: 'Boolean', reflect: 3 }])
      ).rejects.toThrow();

      await expect(
        propertiesSchema.validateAsync([{ name: 'name', type: 'Boolean', primary: 3 }])
      ).rejects.toThrow();

      await expect(
        propertiesSchema.validateAsync([{ name: 'name', type: 'Boolean', changeEvent: 3 }])
      ).rejects.toThrow();

      await expect(
        propertiesSchema.validateAsync([{ name: 'name', type: 'Boolean', changeEvent: true }])
      ).rejects.toThrow();

      await expect(
        propertiesSchema.validateAsync([{ name: 'name', type: 'Turtle' }])
      ).rejects.toThrow();

      await expect(
        propertiesSchema.validateAsync([{ name: 3, type: 'Boolean' }])
      ).rejects.toThrow();
    });

    it(`doesn't accept objects without required properties`, async () => {
      await expect(
        propertiesSchema.validateAsync([{ name: 'name' }])
      ).rejects.toThrow();

      await expect(
        propertiesSchema.validateAsync([{ type: 'Boolean' }])
      ).rejects.toThrow();
    });

    it(`doesn't values that aren't of type 'Array'`, async () => {
      await expect(
        propertiesSchema.validateAsync({ name: 'name', type: 'Boolean' })
      ).rejects.toThrow();
    });
  });

  describe(`cssPropertiesSchema`, () => {
    it(`accepts an array of objects with required name properties and optional description and defaultValue properties`, async () => {
      const values = [
        { name: '--name' }, 
        { name: '--another-name', description: 'description', defaultValue: 'value' },
      ];
      const expected = [
        { name: '--name', description: '', defaultValue: '' }, 
        { name: '--another-name', description: 'description', defaultValue: 'value' },
      ];
      expect(
        await cssPropertiesSchema.validateAsync(values)
      ).toEqual(expected);
    });

    it(`doesn't accept properties with incorrect types`, async () => {
      await expect(
        cssPropertiesSchema.validateAsync([{ name: '--name', description: 0 }])
      ).rejects.toThrow();

      await expect(
        cssPropertiesSchema.validateAsync([{ name: '--name', defaultValue: 0 }])
      ).rejects.toThrow();

      await expect(
        cssPropertiesSchema.validateAsync([{ name: 3 }])
      ).rejects.toThrow();
    });

    it(`doesn't accept objects without required properties`, async () => {
      await expect(
        cssPropertiesSchema.validateAsync([{ description: 'description' }])
      ).rejects.toThrow();
    });

    it(`doesn't values that aren't of type 'Array'`, async () => {
      await expect(
        cssPropertiesSchema.validateAsync({ name: '--name' })
      ).rejects.toThrow();
    });
  });

  describe(`elementSchema`, () => {
    it(`accepts an array of objects with required name property and optional description, atttributes, properties, events, slots, cssProperties, and cssParts properties`, async () => {
      const values = { name: 'some-element' };
      const expected = { name: 'some-element', description: '', attributes: [], properties: [], events: [], slots: [], cssProperties: [], cssParts: [] };
      expect(
        await elementSchema.validateAsync(values)
      ).toEqual(expected);
    });

    it(`doesn't accept objects without required properties`, async () => {
      await expect(
        elementSchema.validateAsync([{ description: 'description' }])
      ).rejects.toThrow();
    });

    it(`doesn't values that aren't of type 'Object'`, async () => {
      await expect(
        elementSchema.validateAsync([{ name: 'some-element' }])
      ).rejects.toThrow();
    });
  });
});