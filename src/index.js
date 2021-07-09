import Webbit from './webbit';
import Store from '@webbitjs/store';
import GamepadProvider from './test/gamepad-provider';

let store = new Store();
store.addSourceProviderType(GamepadProvider);
store.addSourceProvider('Gamepad', 'Gamepad');

document.addEventListener('DOMContentLoaded', () => {
  const element = document.querySelector('#element');
  const webbit = new Webbit(element, store, {
    name: 'div',
    properties: [
      {
        name: 'connected'
      },
      {
        name: 'buttonValues'
      }
    ]
  });
  console.log(webbit.properties);
});


console.log('store:', store);

export default Webbit;