import { render, html } from 'lit';
import Store from '@webbitjs/store';
import GamepadProvider from './gamepad-provider';
import './sources-view';

const store = new Store();

store.addSourceProviderType(GamepadProvider);
store.addSourceProvider('Gamepad', 'Gamepad');

const template = () => html`
    <sources-view provider="Gamepad" .store="${store}"></sources-view>
`;
render(template(), document.querySelector('#sources'))