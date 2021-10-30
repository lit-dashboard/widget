
import { SourceProvider } from '@webbitjs/store';

export default class SampleProvider extends SourceProvider {

  static get typeName() {
    return 'SampleProvider';
  }

  static add(store, providerName = 'SampleProvider') {
    store.addSourceProviderType(SampleProvider);
    store.addSourceProvider("SampleProvider", providerName);
  }

  constructor(store, providerName, settings) {
    super(store, providerName, settings);
  }

  userUpdate(key, value) {
    this.updateSource(key, value);
  }
}
