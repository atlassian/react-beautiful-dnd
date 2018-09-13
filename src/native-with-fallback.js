// @flow
type Map<T> = {
  [key: string]: T,
};

// Use native Object.values if it exists
// Otherwise use Object.keys (ie11)
export function values<T>(map: Map<T>): T[] {
  return Object.values
    ? // https://github.com/facebook/flow/issues/2221
      // $FlowFixMe - Object.values currently does not have good flow support
      Object.values(map)
    : Object.keys(map).map((key: string): T => map[key]);
}

export function find<T>(list: Array<T>, predicate: T => boolean): ?T {
  return list.find ? list.find(predicate) : list.filter(predicate)[0];
}
