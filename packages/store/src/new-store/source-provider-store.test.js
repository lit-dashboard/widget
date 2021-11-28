import SourceProviderStore from "./source-provider-store";
import SourceProvider from "../source-provider";

describe('SourceProviderStore', () => {
  let store;
  let provider;
  beforeEach(() => {
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
});