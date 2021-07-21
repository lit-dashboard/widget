import Webbit from './webbit';
import GamepadProvider from './gamepad-provider';
import Store from '@webbitjs/store';

const store = new Store();
store.addSourceProviderType(GamepadProvider);
store.addSourceProvider('Gamepad', 'Gamepad');

document.addEventListener("DOMContentLoaded", function () {
  const element = document.querySelector('#element');
  new Webbit(element, store, {
    properties: {
      connected: { type: 'Boolean', attribute: 'connected' },
      buttonValues: { type: 'Array', attribute: 'button-values' }
    }
  });
});

export default Webbit;