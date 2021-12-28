import SourceProviderStore from "./source-provider-store";
import SourceProvider from "../source-provider";

describe('SourceProviderStore', () => {
  let store;
  let provider;
  beforeEach(() => {
    jest.useFakeTimers();
    provider = new SourceProvider();
    store = new SourceProviderStore(provider);
  });

  it(`returns the source value`, () => {
    store.updateSource('/a', 3);
    expect(store.getSourceValue('/a')).toBe(3);
  });

  it(`returns undefined if the source value was not set`, () => {
    store.updateSource('/a', 3);
    expect(store.getSourceValue('/b')).toBe(undefined);
  });

  it(`allows you to get a source value in multiple ways`, () => {
    store.updateSource('/a/b/c', 2);
    expect(store.getRootSourceValue()).toEqual({
      '': {
        a: {
          b: { c: 2 }
        }
      }
    });
    expect(store.getSourceValue('/a')).toEqual({
      b: { c: 2 }
    });
    expect(store.getSourceValue('/a/b')).toEqual({ c: 2 });
    expect(store.getSourceValue('/a/b/c')).toEqual(2);
    expect(store.getRootSourceValue()[''].a.b.c).toBe(2);
    expect(store.getSourceValue('/a').b.c).toBe(2);
    expect(store.getSourceValue('/a/b').c).toBe(2);
  });

  it('updates the source value', () => {
    store.updateSource('/a', 2);
    expect(store.getSourceValue('/a')).toBe(2);
    store.updateSource('/a', true);
    expect(store.getSourceValue('/a')).toBe(true);
  });

  it('removes a source value', () => {
    store.updateSource('/a', 5);
    expect(store.getSourceValue('/a')).toBe(5);
    store.removeSource('/a');
    expect(store.getSourceValue('/a')).toBe(undefined);
  });

  it('gets an object if the source has children', () => {
    store.updateSource('/a', 5);
    store.updateSource('/b', 'hi');
    expect(store.getSourceValue('/a')).toBe(5);
    expect(store.getRootSourceValue()).toEqual({
      '': { a: 5, b: 'hi' }
    });
    store.updateSource('/a/b/c', true);
    expect(store.getSourceValue('/a')).toEqual({
      b: { c: true }
    });
    expect(store.getRootSourceValue()).toEqual({
      '': { 
        a: { 
          b: { c: true }
        }, 
        b: 'hi' 
      }
    });
    store.removeSource('/a/b/c');
    expect(store.getSourceValue('/a')).toBe(5);
    expect(store.getRootSourceValue()).toEqual({
      '': { a: 5, b: 'hi' }
    });
    store.removeSource('/b');
    expect(store.getRootSourceValue()).toEqual({ '': { a: 5 }});
  });
  
  it('normalizes keys', () => {
    store.updateSource(' ??/ .A', 5);
    store.updateSource('/b/ b /c', false);
    store.updateSource('c/b', 1);
    expect(store.getSourceValue('/a')).toBe(5);
    expect(store.getSourceValue('/b/b/c')).toBe(false);
    expect(store.getSourceValue('   C/ ..??b')).toBe(1);
    expect(store.getRootSourceValue()).toEqual({
      '': {
        a: 5,
        b: {
          b: {
            c: false
          }
        }
      },
      c: { b: 1 }
    });
  });

  it('caches the source object', () => {
    store.updateSource('/a/b', 3);
    const source = store.getSourceValue('/a');
    expect(source).toEqual({ b: 3 });
    store.updateSource('/a/c', 2);
    expect(source).toEqual({ b: 3, c: 2 });
    store.removeSource('/a/b');
    expect(source).toEqual({ c: 2 });
    store.removeSource('/a/c');
    expect(source).toEqual({});
    expect(store.getSourceValue('/a')).toEqual(undefined);
    store.updateSource('/a/c', 2);
    expect(source).toEqual({ c: 2 });
    expect(store.getSourceValue('/a')).toEqual({ c: 2 });
    expect(source).toBe(store.getSourceValue('/a'));
  });

  it('subscribes to sources that are added', () => {
    const subscriber = jest.fn();
    const parentSubscriber = jest.fn();
    store.subscribe('/a/b', subscriber);
    store.subscribe('/a', parentSubscriber);
    store.updateSource('/a/b', 3);
    expect(subscriber).toHaveBeenCalledWith(3, '/a/b', '/a/b');
    expect(parentSubscriber).toHaveBeenCalledWith({ b: 3 }, '/a', '/a/b');
  });

  it('subscribes immediately to source change values', () => {
    const subscriberNoValue = jest.fn();
    const subscriberWithValue = jest.fn();
    store.subscribe('/a', subscriberNoValue, true);
    expect(subscriberNoValue).toHaveBeenCalledWith(undefined, '/a', '/a');
    store.updateSource('/a', 3);
    store.subscribe('/a', subscriberWithValue, true);
    expect(subscriberWithValue).toHaveBeenCalledWith(3, '/a', '/a');
  });

  it('subscribes to all sources that are added', () => {
    const subscriber = jest.fn();
    store.subscribeAll(subscriber, true);
    expect(subscriber).toHaveBeenCalledTimes(0);
    store.updateSource('/a/b', 3);
    store.updateSource('/a/c/d', 5);
    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber).toHaveBeenNthCalledWith(1, 3, '/a/b');
    expect(subscriber).toHaveBeenNthCalledWith(2, 5, '/a/c/d');
  });

  it('subscribes to source removals', () => {
    const subscriber = jest.fn();
    store.updateSource('/a', 3);
    store.subscribe('/a', subscriber);
    store.removeSource('/a');
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith(undefined, '/a', '/a');
    store.updateSource('/a', 'b');
    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber).toHaveBeenNthCalledWith(2, 'b', '/a', '/a');
  });

  it('unsubscribes from sources', () => {
    const subscriber = jest.fn();
    const subscriberAll = jest.fn();
    const unsubscribe = store.subscribe('/a', subscriber);
    const unsubscribeAll = store.subscribeAll(subscriberAll);
    unsubscribe();
    unsubscribeAll();
    store.updateSource('/a', 3);
    expect(subscriber).not.toHaveBeenCalled();
    expect(subscriberAll).not.toHaveBeenCalled();
  });

  it('updates the source value', () => {
    store.updateSource('/a/b', 3);
    const source = store.getSourceValue('/a');
    source.b = 5;
    jest.advanceTimersByTime(100);
    expect(store.getSourceValue('/a/b')).toBe(5);
  });
});