import { WebbitConnector } from "@webbitjs/webbit";
import Store, { SampleProvider } from "@webbitjs/store";
import nativeElementConfig from './index';
import {
  getByLabelText,
  getByText,
  getByTestId,
  queryByTestId,
  // Tip: all queries are also exposed on an object
  // called "queries" which you could import here as well
  waitFor,
} from '@testing-library/dom';

describe("native elements", () => {
  beforeEach(() => {
    const store = new Store();
    store.addSourceProviderType(SampleProvider);
    store.addSourceProvider("SampleProvider", "SampleProvider");
    store.setDefaultSourceProvider("SampleProvider");
    const connector = new WebbitConnector(store, nativeElementConfig);
    connector.connectChildren(document.body);
  });

  it("does stuff", () => {

  });
});