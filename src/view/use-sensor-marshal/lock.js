// @flow
import invariant from 'tiny-invariant';

export type Lock = {|
  abandon: () => void,
|};

let lock: ?Lock = null;

export function isClaimed(): boolean {
  return Boolean(lock);
}

export function isActive(value: Lock): boolean {
  return value === lock;
}

export function claim(abandon: () => void): Lock {
  invariant(!lock, 'Cannot claim lock as it is already claimed');
  const newLock: Lock = { abandon };
  // update singleton
  lock = newLock;
  // return lock
  return newLock;
}
export function release() {
  invariant(lock, 'Cannot release lock when there is no lock');
  lock = null;
}

export function tryAbandon() {
  if (lock) {
    lock.abandon();
    release();
  }
}
