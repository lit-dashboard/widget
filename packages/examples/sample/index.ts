/* eslint no-global-assign: off */
import Store, { SourceProvider } from '@webbitjs/store';
import { WebbitConnector } from '@webbitjs/webbit';
import { elementConfigs } from '@frc-web-components/components';
import nativeElementConfig from '@webbitjs/native-elements';
import '@webbitjs/dashboard';

const store = new Store();
const provider = new SourceProvider();
store.addSourceProvider('SampleProvider', provider);
store.setDefaultSourceProvider('SampleProvider');
window.store = store;
window.provider = store.getSourceProvider('SampleProvider');

provider.updateSource('/numberBar/value', 3);
// provider.updateSource('/checkbox/checked', true);
// provider.updateSource('/checkbox/title', 'box');
// provider.updateSource('/button/value', 'eee');
provider.updateSource('/box', true);

document.addEventListener('DOMContentLoaded', () => {
  const connector = new WebbitConnector(document.body, store, {
    ...elementConfigs,
    ...nativeElementConfig,
  });
  window.connector = connector;
}, false);