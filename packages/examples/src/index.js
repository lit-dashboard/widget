import Store from '@webbitjs/store';
import { WebbitConnector } from '@webbitjs/webbit';
import SampleProvider from './sample-provider';
import { elementConfigs } from '@frc-web-components/components';
import nativeElementConfig from '@webbitjs/native-elements';

const store = new Store();
store.addSourceProviderType(SampleProvider);
store.addSourceProvider('SampleProvider', 'SampleProvider');
store.setDefaultSourceProvider('SampleProvider');
const connector = new WebbitConnector(store, {
  ...elementConfigs,
  ...nativeElementConfig,
});
window.store = store;
window.provider = store.getSourceProvider('SampleProvider');

window.provider.updateSource('/numberBar', 3);
window.provider.updateSource('/checkbox/checked', true);
window.provider.updateSource('/checkbox/title', "box");

window.provider.updateSource('/button/value', "eee");



document.addEventListener('DOMContentLoaded', () => {
  connector.connectChildren(document.body);
}, false);