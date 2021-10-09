import { normalizeKey } from './util';

describe('util.js', () => {
  describe('normalizeKey', () => {
    it(`doesn't transform when there's nothing to normalize`, () => {
      expect(normalizeKey('')).toBe('');
      expect(normalizeKey('/')).toBe('/');
      expect(normalizeKey('a')).toBe('a');
      expect(normalizeKey('a/b')).toBe('a/b');
      expect(normalizeKey('/a/b')).toBe('/a/b');
    });

    it(`normalizes a key without /`, () => {
      expect(normalizeKey('aa bb cc')).toBe('aaBbCc');
      expect(normalizeKey(' .key')).toBe('key');
      expect(normalizeKey(' Key ')).toBe('key');
      expect(normalizeKey(' Key??.. ')).toBe('key');
    });

    it(`normalizes a key with /`, () => {
      expect(normalizeKey('..aaa /BbbBbb??/ C cc CC')).toBe('aaa/bbbBbb/cCcCc');
      expect(normalizeKey(' ?/./ /')).toBe('///');
    });
  });
});