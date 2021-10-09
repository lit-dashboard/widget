import SourceProvider from './source-provider';
import * as mockSources from './store/sources';
import Store from './store';

jest.mock('./store');

// jest.mock('./store/sources/sources', () => ({
//   getRawSource: jest.fn().mockReturnValue({}),
// }));

class FailProvider extends SourceProvider {
  constructor() {
    super(new Store());
  }
}

class FailProvider2 extends SourceProvider {
  constructor() {
    super(new Store(), 'FailProvider2', {});
  }
}

class FailProvider3 extends SourceProvider {

  static get typeName() {
    return 'FailProvider3';
  }

  constructor() {
    super(new Store(), 'FailProvider3');
  }
}

class TestProvider extends SourceProvider {

  static get typeName() {
    return 'TestProvider';
  }

  constructor(store) {
    super(store, 'TestProvider', {});
  }

  userUpdate(key, value) {
    this.updateSource(key, value);
  }
}

function triggerUpdate() {
  jest.advanceTimersByTime(100);
}

describe('source-provider.js', () => {
  describe('SourceProvider', () => {
    it('Fails to create a direct instance of SourceProvider', () => {
      expect(() => {
        new SourceProvider('Provider');
      }).toThrow('Cannot construct SourceProvider instances directly');
    });

    it(`Fails to create a SourceProvider that doesn't pass a providerName into the super constructor.`, () => {
      expect(() => {
        new FailProvider();
      }).toThrow(`The providerName needs to be passed into super() from your provider's constructor.`);
    });

    it(`Fails to create a SourceProvider that define a typeName`, () => {
      expect(() => {
        new FailProvider2();
      }).toThrow(`A typeName string must be defined.`);
    });
    
    it(`Fails to create a SourceProvider that doesn't pass settings into the super constructor.`, () => {
      expect(() => {
        new FailProvider3();
      }).toThrow(`settings must be passed into the super() from your provider's constructor.`);
    });

    let testProvider;
    let store;

    beforeEach(() => {
      jest.useFakeTimers();
      store = new Store();
      store.subscribe.mockReturnValue(() => {});
      store.subscribeAll.mockReturnValue(() => {});
      store.getRawSource.mockReturnValue({});
      store.getSource.mockReturnValue({});
      store.getSources.mockReturnValue({});
      testProvider = new TestProvider(store);
    });

    it(`does not call sourcesChanged if sources haven't been updated`, () => {
      triggerUpdate();
      expect(store.sourcesChanged).toHaveBeenCalledTimes(0);
    });

    it(`calls sourcesChanged if sources have been updated and after waiting a period of time`, () => {
      testProvider.updateSource('/a', 3);
      expect(store.sourcesChanged).toHaveBeenCalledTimes(0);
      triggerUpdate();
      expect(store.sourcesChanged).toHaveBeenCalledTimes(1);
    });

    it(`does not continue calling sourcesChanged after changes have been sent`, () => {
      testProvider.updateSource('/a', 3);
      triggerUpdate();
      expect(store.sourcesChanged).toHaveBeenCalledTimes(1);
      triggerUpdate();
      expect(store.sourcesChanged).toHaveBeenCalledTimes(1);
    });

    it(`calls sourcesChanged multiple times after multiple updates`, () => {
      testProvider.updateSource('/a', 3);
      triggerUpdate();
      expect(store.sourcesChanged).toHaveBeenCalledTimes(1);
      testProvider.updateSource('/a', 3);
      triggerUpdate();
      expect(store.sourcesChanged).toHaveBeenCalledTimes(2);
    });

    it('calls sourcesChanged with each updated source', () => {
      testProvider.updateSource('/a', 3);
      testProvider.updateSource('/b', true);
      triggerUpdate();
      expect(store.sourcesChanged).toHaveBeenCalledTimes(1);
      expect(store.sourcesChanged).toHaveBeenNthCalledWith(1, 'TestProvider', {
        '/a': 3,
        '/b': true
      });
    });

    it(`calls sourcesChanged with first and most recent updates`, () => {
      testProvider.updateSource('/a', 3);
      testProvider.updateSource('/a', 5);
      testProvider.updateSource('/a', 10);
      testProvider.updateSource('/a/b', 'c');
      triggerUpdate();
      expect(store.sourcesChanged).toHaveBeenCalledTimes(2);
      expect(store.sourcesChanged).toHaveBeenNthCalledWith(1, 'TestProvider', {
        '/a': 3,
        '/a/b': 'c'
      });
      expect(store.sourcesChanged).toHaveBeenNthCalledWith(2, 'TestProvider', {
        '/a': 10
      });
    });

    it(`does not call sourcesRemoved if sources haven't been removed`, () => {
      triggerUpdate();
      expect(store.sourcesRemoved).toHaveBeenCalledTimes(0);
    });

    it(`calls sourcesRemoved if sources have been removed and after waiting a period of time`, () => {
      testProvider.removeSource('/a');
      expect(store.sourcesRemoved).toHaveBeenCalledTimes(0);
      triggerUpdate();
      expect(store.sourcesRemoved).toHaveBeenCalledTimes(1);
    });

    it(`does not continue calling sourcesRemoved after removals have been sent`, () => {
      testProvider.removeSource('/a');
      triggerUpdate();
      expect(store.sourcesRemoved).toHaveBeenCalledTimes(1);
      triggerUpdate();
      expect(store.sourcesRemoved).toHaveBeenCalledTimes(1);
    });

    it(`calls sourcesRemoved multiple times after multiple removals`, () => {
      testProvider.removeSource('/a');
      triggerUpdate();
      expect(store.sourcesRemoved).toHaveBeenCalledTimes(1);
      testProvider.removeSource('/a');
      triggerUpdate();
      expect(store.sourcesRemoved).toHaveBeenCalledTimes(2);
    });

    it('calls sourcesRemoved with each removed source', () => {
      testProvider.removeSource('/a');
      testProvider.removeSource('/b');
      triggerUpdate();
      expect(store.sourcesRemoved).toHaveBeenCalledTimes(1);
      expect(store.sourcesRemoved).toHaveBeenNthCalledWith(1, 'TestProvider', [
        '/a', '/b' 
      ]);
    });

    it(`calls sourcesChanged and sourcesRemoved in order of when they were triggered`, () => {
      
      let mockUpdates = {
        '/a': [],
        '/b': [],
        '/c': [],
        '/d': [],
        '/e': [],
        '/f': [],
        '/g': [],
        '/h': []
      };

      store.sourcesChanged.mockImplementation((_, changes) => {
        for (let key in changes) {
          mockUpdates[key].push('change');
        }
      });

      store.sourcesRemoved.mockImplementation((_, removals) => {
        removals.forEach(removal => {
          mockUpdates[removal].push('removal');
        });
      });

      testProvider.updateSource('/a', 1);
      testProvider.updateSource('/a', 2);
      testProvider.updateSource('/a', 3);

      testProvider.updateSource('/b', 1);
      testProvider.updateSource('/b', 2);
      testProvider.removeSource('/b');

      testProvider.updateSource('/c', 1);
      testProvider.removeSource('/c');
      testProvider.updateSource('/c', 2);

      testProvider.updateSource('/d', 1);
      testProvider.removeSource('/d');
      testProvider.removeSource('/d');

      testProvider.removeSource('/e');
      testProvider.updateSource('/e', 2);
      testProvider.updateSource('/e', 3);

      testProvider.removeSource('/f');
      testProvider.updateSource('/f', 2);
      testProvider.removeSource('/f');

      testProvider.removeSource('/g');
      testProvider.removeSource('/g');
      testProvider.updateSource('/g', 2);

      testProvider.removeSource('/h');
      testProvider.removeSource('/h');
      testProvider.removeSource('/h');

      triggerUpdate();

      expect(mockUpdates).toEqual({
        '/a': ['change', 'change'],
        '/b': ['change', 'removal'],
        '/c': ['change', 'change'],
        '/d': ['change', 'removal'],
        '/e': ['removal', 'change'],
        '/f': ['removal', 'removal'],
        '/g': ['removal', 'change'],
        '/h': ['removal', 'removal']
      });
    });

    it(`clears sources when clearSources is called`, () => {
      testProvider.clearSources();
      expect(store.clearSources).toHaveBeenCalledTimes(1);
      expect(store.clearSources).toHaveBeenNthCalledWith(1, 'TestProvider');
    });

    it(`clears sources after a timeout`, () => {
      testProvider.clearSourcesWithTimeout(2000);
      jest.advanceTimersByTime(1500);
      expect(store.clearSources).toHaveBeenCalledTimes(0);
      jest.advanceTimersByTime(1500);
      expect(store.clearSources).toHaveBeenCalledTimes(1);
    });

    it(`stops sources from clearing if sources are updated before timeout expires`, () => {
      testProvider.clearSourcesWithTimeout(2000);
      jest.advanceTimersByTime(1500);
      expect(store.clearSources).toHaveBeenCalledTimes(0);
      testProvider.updateSource('/a', 1);
      jest.advanceTimersByTime(1500);
      expect(store.clearSources).toHaveBeenCalledTimes(0);
    });

    it(`makes updates immediately when clearSources is called`, () => {
      testProvider.updateSource('/a', 1);
      testProvider.clearSources();
      expect(store.sourcesChanged).toHaveBeenCalledTimes(1);
      expect(store.sourcesChanged).toHaveBeenNthCalledWith(1, 'TestProvider', {
        '/a': 1
      });
      testProvider.updateSource('/a', 2);
      triggerUpdate();
      expect(store.sourcesChanged).toHaveBeenCalledTimes(2);
      expect(store.sourcesChanged).toHaveBeenNthCalledWith(2, 'TestProvider', {
        '/a': 2
      });
      testProvider.updateSource('/a', 1);
      testProvider.updateSource('/a', 2);
      testProvider.clearSources(() => {
        expect(store.sourcesChanged).toHaveBeenCalledTimes(4);
        triggerUpdate();
        expect(store.sourcesChanged).toHaveBeenCalledTimes(4);
      });
      jest.advanceTimersByTime(0);
    });

    it('subscribes to a particular source when subscribe is called', () => {
      const mockCallback = jest.fn();
      const cancel = testProvider.subscribe('/a', mockCallback, true);
      expect(cancel).toEqual(expect.any(Function));
      expect(store.subscribe).toHaveBeenCalledTimes(1);
      expect(store.subscribe).toHaveBeenNthCalledWith(1, 'TestProvider', '/a', mockCallback, true);
    });

    it('subscribes to all sources when subscribeAll is called', () => {
      const mockCallback = jest.fn();
      const cancel = testProvider.subscribeAll( mockCallback, true);
      expect(cancel).toEqual(expect.any(Function));
      expect(store.subscribeAll).toHaveBeenCalledTimes(1);
      expect(store.subscribeAll).toHaveBeenNthCalledWith(1, 'TestProvider', mockCallback, true);
    });

    it('gets a source when getSource is called', () => {
      const source = testProvider.getSource('/a');
      expect(source).toEqual({});
      expect(store.getSource).toHaveBeenCalledTimes(1);
      expect(store.getSource).toHaveBeenNthCalledWith(1, 'TestProvider', '/a');
    });

    it('gets a raw source when getRawSource is called', () => {
      const rawSource = testProvider.getRawSource('/a');
      expect(rawSource).toEqual({});
      expect(store.getRawSource).toHaveBeenCalledTimes(1);
      expect(store.getRawSource).toHaveBeenNthCalledWith(1, 'TestProvider', '/a');
    });

    it('gets all sources when getSources is called', () => {
      const allSources = testProvider.getSources();
      expect(allSources).toEqual({});
      expect(store.getSources).toHaveBeenCalledTimes(1);
      expect(store.getSources).toHaveBeenNthCalledWith(1, 'TestProvider');
    });

    it('gets the name of a type when getType is called', () => {
      expect(testProvider.getType('hello')).toBe('string');
      expect(testProvider.getType(10)).toBe('number');
      expect(testProvider.getType(false)).toBe('boolean');
      expect(testProvider.getType([1,2,3])).toBe('Array');
      expect(testProvider.getType(null)).toBe('null');
      expect(testProvider.getType(undefined)).toBe(null);
    });
    
    it('no longer sends updates when _disconnect is called', () => {
      testProvider._disconnect();
      testProvider.updateSource('/a', 3);
      testProvider.updateSource('/b', true);
      triggerUpdate();
      expect(store.sourcesChanged).toHaveBeenCalledTimes(0);
    });
  });
});