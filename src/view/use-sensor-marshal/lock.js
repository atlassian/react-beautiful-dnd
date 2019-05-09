// @flow
import invariant from 'tiny-invariant';
import type { DraggableId } from '../../types';
import { warning } from '../../dev-warning';

type Lock = {|
  id: DraggableId,
  abort: () => void,
|};

let lock: ?Lock = null;

export function getLock(): ?Lock {
  return lock;
}

export function obtainLock(id: DraggableId, abort: () => void) {
  invariant(!lock, 'Cannot claim lock as it is already claimed');
  lock = { id, abort };
}
export function releaseLock() {
  invariant(lock, 'Cannot release lock when there is no lock');
  lock = null;
}
export function tryAbortLock() {
  if (lock) {
    lock.abort();
    if (lock != null) {
      warning('aborting lock did not clear it');
    }
  }
}
