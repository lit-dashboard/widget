import testElement from "./test-element";
import Store, { SampleProvider } from "@webbitjs/store";
import { WebbitConnector } from "@webbitjs/webbit";

function getConnector(elementConfigs) {
  const store = new Store();
  SampleProvider.add(store);
  store.setDefaultSourceProvider("SampleProvider");
  const connector = new WebbitConnector(store, elementConfigs);
  connector.connectChildren(document.body);
  return connector;
}

function getResultMessage(title, pass, { actual, expected }) {
  let errorMessage = '';
  try {
    if (pass) {
      expect(actual).not.toEqual(expected);
    } else {
      expect(actual).toEqual(expected);
    }
  } catch(e) {
    errorMessage = e.message;
  }
  return `${title}:\n${errorMessage}`;
}

expect.extend({
  async toBeValidWebbitConfig({ elementConfigs, html, values }) {
    const connector = getConnector(elementConfigs);
    const {
      storeValuesFromPropertiesResult,
      propertyValuesFromStoreResult,
      defaultPropertyValuesResult,
    } = await testElement(connector, { html, values });

    const pass = 
      storeValuesFromPropertiesResult.pass 
      && propertyValuesFromStoreResult.pass
      && defaultPropertyValuesResult.pass;

    const message = () => {
      return [
        `Webbit config should${pass ? ' NOT ' : ' '}be vaild.`,
        getResultMessage(
          'Tests setting store values from element properties',
          pass,
          storeValuesFromPropertiesResult,
        ),
        getResultMessage(
          'Tests setting element properties from store values',
          pass,
          propertyValuesFromStoreResult,
        ),
        getResultMessage(
          'Tests element default property values',
          pass,
          defaultPropertyValuesResult,
        ),
      ].join('\n\n');
    };

    return { message, pass };
  }
});