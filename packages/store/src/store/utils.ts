import Source from './source';

export function isSourceDead(source: Source): boolean {
  if (source.hasValue()) {
    return false;
  }
  return Object.keys(source.getChildren()).length === 0;
}

export default isSourceDead;