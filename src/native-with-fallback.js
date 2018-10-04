// @flow
type Map<T> = {
  [key: string]: T,
};

// @babel/runtime-corejs2 will replace Object.values
export function values<T>(map: Map<T>): T[] {
  return Object.values
    ? // https://github.com/facebook/flow/issues/2221
      // $FlowFixMe - Object.values currently does not have good flow support
      Object.values(map)
    : Object.keys(map).map((key: string): T => map[key]);
}

export function find<T>(list: Array<T>, predicate: T => boolean): ?T {
  if (list.find) {
    return list.find(predicate);
  }
  // Using a for loop so that we can exit early
  // alternative: list.filter(predicate)[0]
  for (let i = 0; i < list.length; i++) {
    if (predicate(list[i])) {
      return list[i];
    }
  }
  // Array.prototype.find returns undefined when nothing is found
  return undefined;
}

export function findIndex<T>(list: Array<T>, predicate: T => boolean): number {
  return list.findIndex
    ? list.findIndex(predicate)
    : list.indexOf(find(list, predicate));
}
