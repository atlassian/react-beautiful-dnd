// @flow
type Map<T> = {
  [key: string]: T,
};

// @babel/runtime-corejs2 will replace Object.values
// Using this helper to ensure there are correct flow types
// https://github.com/facebook/flow/issues/2221
export function values<T>(map: Map<T>): T[] {
  // $FlowFixMe - Object.values currently does not have good flow support
  return Object.values(map);
}

// Could also extend to pass index and list
type PredicateFn<T> = (value: T) => boolean;

export function find<T>(list: Array<T>, predicate: PredicateFn<T>): ?T {
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

export function findIndex<T>(
  list: Array<T>,
  predicate: PredicateFn<T>,
): number {
  return list.findIndex
    ? list.findIndex(predicate)
    : list.indexOf(find(list, predicate));
}
