import elementConfigs from './index';
import './matchers';

describe("native elements", () => {

  it("tests a checkbox", async () => {
    await expect({
      elementConfigs,
      html: '<input type="checkbox" />',
      values: {
        value: { start: '', end: 'value' },
        name: { start: '', end: 'name' },
        checked: { start: false, end: true, userEvent: 'click' },
        disabled: { start: false, end: true },
        required: { start: false, end: true },
        title: { start: '', end: 'title' },
      }
    }).toBeValidWebbitConfig();
  });

  it("tests a button", async () => {
    await expect({
      elementConfigs,
      html: '<button>Button</button>',
      values: {
        value: { start: '', end: 'value' },
        name: { start: '', end: 'name' },
        type: { start: 'submit', end: 'button' },
        disabled: { start: false, end: true },
        title: { start: '', end: 'title' },
      }
    }).toBeValidWebbitConfig();
  });

});