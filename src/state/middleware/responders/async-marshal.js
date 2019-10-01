// @flow
import { invariant } from '../../../invariant';
import { findIndex } from '../../../native-with-fallback';

type Entry = {|
  timerId: TimeoutID,
  callback: Function,
|};

export type AsyncMarshal = {|
  add: (fn: Function) => void,
  flush: () => void,
|};

export default () => {
  const entries: Entry[] = [];

  const execute = (timerId: TimeoutID) => {
    const index: number = findIndex(
      entries,
      (item: Entry): boolean => item.timerId === timerId,
    );
    invariant(index !== -1, 'Could not find timer');
    // delete in place
    const [entry] = entries.splice(index, 1);
    entry.callback();
  };

  const add = (fn: Function) => {
    const timerId: TimeoutID = setTimeout(() => execute(timerId));
    const entry: Entry = {
      timerId,
      callback: fn,
    };
    entries.push(entry);
  };

  const flush = () => {
    // nothing to flush
    if (!entries.length) {
      return;
    }

    const shallow: Entry[] = [...entries];
    // clearing entries in case a callback adds some more callbacks
    entries.length = 0;

    shallow.forEach((entry: Entry) => {
      clearTimeout(entry.timerId);
      entry.callback();
    });
  };

  return { add, flush };
};
