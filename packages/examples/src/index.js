import Store from '@webbitjs/store';
import Webbit from '@webbitjs/webbit';
import { NetworkTablesProvider } from '@frc-web-components/source-providers';
import { elementConfigs } from '@frc-web-components/components';

const store = new Store();
store.addSourceProviderType(NetworkTablesProvider);
store.addSourceProvider('NetworkTables', 'NetworkTables');

document.addEventListener('DOMContentLoaded', () => {
  const booleanBox = document.querySelector('frc-boolean-box');
  const numberBar = document.querySelector('frc-accelerometer');
  new Webbit(booleanBox, store, elementConfigs['frc-boolean-box']);
  new Webbit(numberBar, store, elementConfigs['frc-number-bar']);
}, false);