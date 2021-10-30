import { screen, waitFor } from '@testing-library/dom';

export default async (connector, { html, values }) => {
  const store = connector.getStore();
  store.clearSources();
  document.body.innerHTML = html;
  const element = document.body.children[0];
  element.setAttribute('source-key', '/element');
  const elementConfig = connector.getMatchingElementConfig(element);
  expect(elementConfig).toBeTruthy();
  const { properties } = elementConfig;
  const entries = Object.entries(values)
    .filter(([propName]) => propName in properties);

  entries.forEach(([propName, value]) => {
    const propConfig = properties[propName];
    if (!propConfig) {
      return;
    }
    const { attribute, property } = propConfig;
    if (property) {
      element[property] = value;
    } else {
      element.setAttribute(attribute, value);
    }
  });

  await waitFor(() => {
    entries.forEach(([propName, value]) => {
      expect(
        store.getSource('SampleProvider', `/element/${propName}`)
      ).toEqual(value);
    });
  });
};