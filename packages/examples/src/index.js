import Store from '@webbitjs/store';
import { WebbitConnector } from '@webbitjs/webbit';
import SampleProvider from './sample-provider';
import { elementConfigs } from '@frc-web-components/components';

const store = new Store();
store.addSourceProviderType(SampleProvider);
store.addSourceProvider('SampleProvider', 'SampleProvider');
const connector = new WebbitConnector(store, elementConfigs);
window.store = store;
window.provider = store.getSourceProvider('SampleProvider');
window.provider.updateSource('/numberBar', 3);


document.addEventListener('DOMContentLoaded', () => {
  const booleanBox = document.querySelector('frc-boolean-box');
  const numberBar = document.querySelector('frc-accelerometer');
  connector.connect(booleanBox);
  connector.connect(numberBar);
}, false);