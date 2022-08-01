import { normalizeConfig } from './index';

const getConfig = ({
  description = '',
  defaultSourceKey = false,
  defaultSourceProvider = false,
  properties = {},
  events = [],
  slots = [],
  cssProperties = [],
  cssParts = [],
} = {}) => ({
  description,
  defaultSourceKey,
  defaultSourceProvider,
  properties,
  events,
  slots,
  cssProperties,
  cssParts,
});

describe('Element config', () => {
  xit(`returns the same configuration if it's already valid`, () => {
    const config = getConfig();
    expect(config).toEqual(normalizeConfig(config));
  });

  xit(`adds default values`, () => {
    expect(
      normalizeConfig({ name: 'some-element-name' })
    ).toEqual(getConfig());
  });

  xit(`throws an error if the element name isn't in kebab case`, () => {
    expect(() => {
      normalizeConfig({ name: 'invalidName' })
    }).toThrow();
  });

  xit(`throws an error if the element name isn't provided`, () => {
    expect(() => {
      normalizeConfig({})
    }).toThrow();
  });
});