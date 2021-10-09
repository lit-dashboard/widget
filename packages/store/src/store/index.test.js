import SourceProvider from '../source-provider';
import Sources from './sources';
import Store from './index';

jest.mock('./sources');

class FailProvider extends SourceProvider {}

class TestProvider extends SourceProvider {
  static get typeName() {
    return 'TestProvider';
  }
}

class TestProvider2 extends SourceProvider {

  static get settingsDefaults() {
    return {
      a: 1,
      b: 2
    };
  }

  static get typeName() {
    return 'TestProvider2';
  }
}

function triggerUpdate() {
  jest.advanceTimersByTime(100);
}

describe('index.js', () => {

  let store;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    store = new Store();
  });

  it('fails to add a source provider type without a typeName', () => {
    expect(() => {
      store.addSourceProviderType(FailProvider);
    }).toThrow(`A typeName for your source provider type must be set.`);
  });

  it('fails to add a source provider type with the same name as one that has already been added.', () => {
    expect(() => {
      store.addSourceProviderType(TestProvider);
      store.addSourceProviderType(TestProvider);
    }).toThrow(`A source provider type with the same name has already been added.`);
  });

  it('successfully adds a source provider type', () => {
    expect(store.hasSourceProviderType('TestProvider')).toBe(false);
    store.addSourceProviderType(TestProvider);
    expect(store.hasSourceProviderType('TestProvider')).toBe(true);
    expect(store.getSourceProviderTypeNames()).toEqual(['TestProvider']);
  });

  it('successfully adds two source provider types', () => {
    expect(store.getSourceProviderTypeNames()).toEqual([]);
    store.addSourceProviderType(TestProvider);
    store.addSourceProviderType(TestProvider2);
    expect(store.getSourceProviderTypeNames()).toEqual(['TestProvider', 'TestProvider2']);
  });

  it(`fails to add a provider for a type that hasn't been added`, () => {
    expect(() => {
      store.addSourceProvider('TestProvider');
    }).toThrow(`A source provider type with that name hasn't been added`);
  });

  it(`fails to add a provider with a name that has already been taken`, () => {
    store.addSourceProviderType(TestProvider);
    store.addSourceProvider('TestProvider', 'TestProvider');
    expect(() => {
      store.addSourceProvider('TestProvider', 'TestProvider');
    }).toThrow(`A source provider with that name has already been added.`);
  });

  it(`successfully adds a provider`, () => {
    store.addSourceProviderType(TestProvider);
    store.addSourceProvider('TestProvider', 'TestProvider');
    expect(store.hasSourceProvider('TestProvider')).toBe(true);
  });

  it(`successfully adds a provider without specifying a name`, () => {
    store.addSourceProviderType(TestProvider);
    store.addSourceProvider('TestProvider');
    expect(store.hasSourceProvider('TestProvider')).toBe(true);
  });

  it(`successfully adds two source providers of the same type`, () => {
    store.addSourceProviderType(TestProvider);
    const provider1 = store.addSourceProvider('TestProvider');
    const provider2 = store.addSourceProvider('TestProvider', 'TestProvider2');
    expect(provider1.constructor.name).toBe('TestProvider');
    expect(provider2.constructor.name).toBe('TestProvider');
    expect(store.hasSourceProvider('TestProvider')).toBe(true);
    expect(store.hasSourceProvider('TestProvider2')).toBe(true);
    expect(store.getSourceProvider('TestProvider')).toEqual(provider1);
    expect(store.getSourceProvider('TestProvider2')).toEqual(provider2);
    expect(store.getSourceProviderNames()).toEqual(['TestProvider', 'TestProvider2']);
  });

  it(`successfully passes settings into a source provider when created`, () => {
    store.addSourceProviderType(TestProvider2);
    const provider1 = store.addSourceProvider('TestProvider2', 'Provider1');
    const provider2 = store.addSourceProvider('TestProvider2', 'Provider2', {});
    const provider3 = store.addSourceProvider('TestProvider2', 'Provider3', { b: 3, c: 4 });
    const provider4 = store.addSourceProvider('TestProvider2', 'Provider4', null);
    const provider5 = store.addSourceProvider('TestProvider2');
    expect(provider1.settings).toEqual({ a: 1, b: 2 });
    expect(provider2.settings).toEqual({ a: 1, b: 2 });
    expect(provider3.settings).toEqual({ a: 1, b: 3, c: 4 });
    expect(provider4.settings).toEqual({ a: 1, b: 2 });
    expect(provider5.settings).toEqual({ a: 1, b: 2 });
  });

  it('fails to add a listener if a function is not given', () => {
    expect(() => {
      store.sourceProviderAdded();
    }).toThrow('listener is not a function');
  });

  it(`allows you to listen for when providers are added`, () => {
    const mockListener = jest.fn();
    store.sourceProviderAdded(mockListener);
    store.addSourceProviderType(TestProvider);
    store.addSourceProvider('TestProvider');
    store.addSourceProvider('TestProvider', 'TestProvider2');
    expect(mockListener).toHaveBeenCalledTimes(2);
    expect(mockListener).toHaveBeenNthCalledWith(1, 'TestProvider');
    expect(mockListener).toHaveBeenNthCalledWith(2, 'TestProvider2');
  });

  it(`successfully removes a source provider`, () => {
    store.addSourceProviderType(TestProvider);
    const provider = store.addSourceProvider('TestProvider');
    provider.updateSource('/a', 1);
    triggerUpdate();
    provider.updateSource('/a', 2);
    triggerUpdate();
    store.removeSourceProvider('TestProvider');
    provider.updateSource('/a', 2);
    triggerUpdate();
    expect(store.sources.sourcesChanged).toHaveBeenCalledTimes(2);
    expect(store.hasSourceProvider('TestProvider')).toBe(false);
    expect(store.getSourceProvider('TestProvider')).toBe(undefined);
  });

  it('fails to add a listener for when the default source provider is set when the listener is not a function', () => {
    expect(() => {
      store.defaultSourceProviderSet();
    }).toThrow('listener is not a function');
  });

  it('sets the default source provider', () => {
    const mockListener = jest.fn();
    store.defaultSourceProviderSet(mockListener);
    store.setDefaultSourceProvider('SomeProvider');
    expect(store.getDefaultSourceProvider()).toBe('SomeProvider');
    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(mockListener).toHaveBeenNthCalledWith(1, 'SomeProvider');
  });
});