import { normalizeConfig } from './index';

const getConfig = ({
  name = 'some-element-name',
  description = '',
  defaultSourceKey = false,
  defaultSourceProvider = false,
  properties = [],
  events = [],
  slots = [],
  cssProperties = [],
  cssParts = [],
} = {}) => ({
  name,
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
  it(`returns the same configuration if it's already valid`, () => {
    const config = getConfig();
    expect(config).toEqual(normalizeConfig(config));
  });

  it(`adds default values`, () => {
    expect(
      normalizeConfig({ name: 'some-element-name' })
    ).toEqual(getConfig());
  });

  it(`throws an error if the element name isn't in kebab case`, () => {
    expect(() => {
      normalizeConfig({ name: 'invalidName' })
    }).toThrow();
  });

  it(`throws an error if the element name isn't provided`, () => {
    expect(() => {
      normalizeConfig({})
    }).toThrow();
  });
});