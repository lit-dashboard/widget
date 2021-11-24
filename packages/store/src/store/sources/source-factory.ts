/* eslint no-underscore-dangle: off */

export type RawSource = {
  __normalizedKey__?: string,
  __fromProvider__: boolean,
  __key__?: string,
  __value__?: unknown,
  __sources__: Record<string, RawSource>,
};

export type RawSources = Record<string, RawSource>;

export class Source {
  static get __WEBBIT_CLASSNAME__(): string {
    return 'Source';
  }
}

export type ProviderSource = {
  getterValues: Record<string, unknown>,
  setters: Record<string, (value: unknown) => void>,
  sources: Record<string, Source>,
};

export const isSourceType = (value: unknown): boolean => value instanceof Source;

export const createRawSource = (): RawSource => ({
  __normalizedKey__: undefined,
  __fromProvider__: false,
  __key__: undefined,
  __value__: undefined,
  __sources__: {},
});

export const createSource = (): ProviderSource => ({
  getterValues: {},
  setters: {},
  sources: {},
});