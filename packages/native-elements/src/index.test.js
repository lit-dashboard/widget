import { WebbitConnector } from "@webbitjs/webbit";
import Store, { SampleProvider } from "@webbitjs/store";
import nativeElementConfig from './index';
import { screen, waitFor } from '@testing-library/dom';
import testElement from "./test-element";

const tests = [
  {
    html: '<input type="checkbox" />',
    values: {
      value: "value",
      name: "name",
      checked: true,
      disabled: true,
      required: true,
      title: "title"
    }
  }
];

describe("native elements", () => {
  beforeEach(() => {
    const store = new Store();
    SampleProvider.add(store);
    store.setDefaultSourceProvider("SampleProvider");
    const connector = new WebbitConnector(store, nativeElementConfig);
    connector.connectChildren(document.body);
    const provider = store.getSourceProvider("SampleProvider");
    provider.updateSource('/button/value', 'val');
  });

  it("does stuff", async () => {
    document.body.innerHTML = `
      <button data-testid="element" source-key="/button"></button>
    `;
    const button = screen.getByTestId('element');

    await waitFor(() => {
      expect(button.getAttribute('value')).toBe('val');
    });
  });
});