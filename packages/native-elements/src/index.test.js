import { WebbitConnector } from "@webbitjs/webbit";
import Store, { SampleProvider } from "@webbitjs/store";
import nativeElementConfig from './index';

describe("native elements", () => {
  beforeEach(() => {
    const store = new Store();
    store.addSourceProviderType(SampleProvider);
    store.addSourceProvider("SampleProvider", "SampleProvider");
    store.setDefaultSourceProvider("SampleProvider");
    const connector = new WebbitConnector(store, nativeElementConfig);
    connector.connectChildren(global.window.document.body);
  });

  it("does stuff", () => {

  });
});