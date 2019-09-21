// @flow
import invariant from 'tiny-invariant';

export type Lock = {|
  abandon: () => void,
|};

export type LockAPI = {|
  isClaimed: () => boolean,
  isActive: (lock: Lock) => boolean,
  claim: (abandon: () => void) => Lock,
  release: () => void,
  tryAbandon: () => void,
|};

export default function create(): LockAPI {
  let lock: ?Lock = null;

  function isClaimed(): boolean {
    return Boolean(lock);
  }

  function isActive(value: Lock): boolean {
    return value === lock;
  }

  function claim(abandon: () => void): Lock {
    invariant(!lock, 'Cannot claim lock as it is already claimed');
    const newLock: Lock = { abandon };
    // update singleton
    lock = newLock;
    // return lock
    return newLock;
  }
  function release() {
    invariant(lock, 'Cannot release lock when there is no lock');
    lock = null;
  }

  function tryAbandon() {
    if (lock) {
      lock.abandon();
      release();
    }
  }

  return { isClaimed, isActive, claim, release, tryAbandon };
}
