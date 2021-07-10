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
        name: 'connected',
        type: 'Boolean',
        attribute: 'connected',
        primary: true,
      },
      {
        name: 'buttonValues',
        type: 'Array',
        attribute: 'button-values'
      }
    ]
  });
  console.log(webbit.properties);
});


console.log('store:', store);

export default Webbit;