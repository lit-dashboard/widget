import SourceProvider from './source-provider';
import Store from './store';

export default class SampleProvider extends SourceProvider {
  static get typeName(): string {
    return 'SampleProvider';
  }

  static add(store: Store, providerName = 'SampleProvider'): void {
    store.addSourceProviderType(SampleProvider);
    store.addSourceProvider('SampleProvider', providerName);
  }

  userUpdate(key: string, value: unknown): void {
    this.updateSource(key, value);
  }
}
