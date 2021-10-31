import { waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

async function waitForResult(callback) {
  let actual = null;
  let expected = null;
  let pass = false;
  try {
    await waitFor(() => {
      const result = callback() ?? {};
      actual = result.actual ?? null;
      expected = result.expected ?? null;
      expect(actual).toEqual(expected);
    });
    pass = true;
  } catch (e) { }

  return { actual, expected, pass };
}

export default async (connector, testConfig) => {
  return {
    storeValuesFromPropertiesResult:
      await testSettingStoreValuesFromProperties(connector, testConfig),
    propertyValuesFromStoreResult:
      await testSettingPropertyValuesFromStore(connector, testConfig),
    defaultPropertyValuesResult:
      await testSettingDefaultPropertyValues(connector, testConfig),
  };
};

async function testSettingStoreValuesFromProperties(connector, { html, values }) {
  const { properties, element } = setupStoreAndElement(connector, html);
  const { startValues, endValues } = getPropertyValues(values, properties);

  setStoreValues(startValues, properties, connector.store);

  const result = await checkStoreValues(startValues, connector);

  if (!result.pass) {
    return result;
  }

  setElementPropertyValues(endValues, properties, element);
  return await checkStoreValues(endValues, connector);
}

async function testSettingPropertyValuesFromStore(connector, { html, values }) {
  const { properties, element } = setupStoreAndElement(connector, html);
  const { endValues } = getPropertyValues(values, properties);

  setStoreValues(endValues, properties, connector.store);
  return await checkPropertyValues(endValues, properties, element);
}

async function testSettingDefaultPropertyValues(connector, { html }) {
  const { properties, element } = setupStoreAndElement(connector, html);
  const defaultValues = getDefaultPropertyValues(properties);
  return await checkPropertyValues(defaultValues, properties, element);
}

function getDefaultPropertyValues(properties) {
  return Object.fromEntries(
    Object.entries(properties).map(([propName, { defaultValue }]) => (
      [propName, { value: defaultValue }]
    ))
  );
}

function checkStoreValues(values, connector) {
  return waitForResult(() => {
    const actual = {};
    const expected = {};
    Object.entries(values).forEach(([propName, { value }]) => {
      actual[propName] = connector.store.getSource('SampleProvider', `/element/${propName}`);
      expected[propName] = value;
    });
    return { actual, expected };
  });
}

function checkPropertyValues(values, properties, element) {
  return waitForResult(() => {
    const actual = {};
    const expected = {};
    Object.entries(values).forEach(([propName, { value }]) => {
      const propConfig = properties[propName];
      if (!propConfig) {
        return;
      }
      const { attribute, property } = propConfig;
      actual[propName] = property
        ? element[property]
        : element.getAttribute(attribute);
      expected[propName] = value;
    });
    return { actual, expected };
  });
}

function getPropertyValues(values, properties) {
  const entries = Object.entries(values)
    .filter(([propName]) => propName in properties);
  const startValues = Object.fromEntries(
    entries.map(([propName, value]) => [propName, {
      value: value.start,
      userEvent: value.userEvent,
    }])
  );
  const endValues = Object.fromEntries(
    entries.map(([propName, value]) => [propName, {
      value: value.end,
      userEvent: value.userEvent,
    }])
  );
  return { startValues, endValues };
}

function setElementPropertyValues(values, properties, element) {
  Object.entries(values).forEach(([propName, { value, userEvent: event }]) => {
    const propConfig = properties[propName];
    if (!propConfig) {
      return;
    }
    const { attribute, property } = propConfig;
    if (event === 'click') {
      userEvent.click(element);
    } else if (property) {
      element[property] = value;
    } else {
      element.setAttribute(attribute, value);
    }
  });
}

async function setStoreValues(values, properties, store) {
  const provider = store.getSourceProvider('SampleProvider');
  Object.entries(values).map(([propName, { value }]) => {
    if (properties[propName]) {
      provider.updateSource(`/element/${propName}`, value);
    }
  });
}

function setupStoreAndElement(connector, html) {
  const store = connector.getStore();
  store.clearSources();
  document.body.innerHTML = html;
  const element = document.body.children[0];
  element.setAttribute('source-connected', '');
  element.setAttribute('source-key', '/element');
  const elementConfig = connector.getMatchingElementConfig(element);
  expect(elementConfig).toBeTruthy();
  const { properties } = elementConfig;
  return { properties, element };
}
