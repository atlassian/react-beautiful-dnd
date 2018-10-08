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

export function findIndex<T>(
  list: Array<T>,
  predicate: PredicateFn<T>,
): number {
  if (list.findIndex) {
    return list.findIndex(predicate);
  }

  // Using a for loop so that we can exit early
  for (let i = 0; i < list.length; i++) {
    if (predicate(list[i])) {
      return i;
    }
  }
  // Array.prototype.find returns -1 when nothing is found
  return -1;
}

export function find<T>(list: Array<T>, predicate: PredicateFn<T>): ?T {
  if (list.find) {
    return list.find(predicate);
  }
  const index: number = findIndex(list, predicate);
  if (index !== -1) {
    return list[index];
  }
  // Array.prototype.find returns undefined when nothing is found
  return undefined;
}
