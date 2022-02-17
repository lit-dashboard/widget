import Source from './source';
import { normalizeKey } from '../util';

export function isSourceDead(source: Source): boolean {
  if (source.hasValue()) {
    return false;
  }
  return Object.keys(source.getChildren()).length === 0;
}
export function getNormalizedKey(key: string): string {
  return `${normalizeKey(key)}`;
}
