// @flow
/* eslint-disable no-use-before-define */

export type Warmer = {|
  register: (fn: Function) => void,
  stop: () => void,
|};
const isSupported: boolean =
  typeof window !== 'undefined' &&
  typeof requestIdleCallback !== 'undefined' &&
  typeof cancelAnimationFrame !== 'undefined';

const noop = () => {};
const empty: Warmer = {
  register: noop,
  stop: noop,
};

// Flow does not have this type so I am making it here
// https://developer.mozilla.org/en-US/docs/Web/API/IdleDeadline
type IdleDeadline = {
  timeRemaining: () => number,
  didTimeout: boolean,
};

export default () => {
  if (!isSupported) {
    return empty;
  }
  let isActive: boolean = true;
  let warmUpId: ?IdleCallbackID = null;
  const toWarm: Function[] = [];

  const work = (deadline: IdleDeadline) => {
    warmUpId = null;
    if (!toWarm.length) {
      return;
    }

    // grab the first and remove it from the array
    const fn: Function = toWarm.shift();

    // exit condition setup
    let callCount = 0;
    const start: number = Date.now();

    while (
      // trying to get to 10 calls
      callCount < 10 &&
      // only allowing a max of one millisecond of operations
      Date.now() - start < 1 &&
      // super safe: making sure we do not exceed the allowed time
      deadline.timeRemaining() > 0
    ) {
      fn();
      callCount++;
    }

    console.log('warmer did work', callCount);

    if (!toWarm.length) {
      console.log('no more warmer work');
      return;
    }
    schedule();
  };

  const schedule = () => {
    if (!isActive) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Cannot schedule more warm up work when no longer active');
      }
      return;
    }
    if (warmUpId) {
      return;
    }

    warmUpId = requestIdleCallback(work);
  };

  const abortScheduled = () => {
    if (!warmUpId) {
      return;
    }
    cancelIdleCallback(warmUpId);
    warmUpId = null;
  };

  const register = (fn: Function) => {
    if (!isActive) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Cannot register more warm up work when no longer active');
      }
      return;
    }
    toWarm.push(fn);
    schedule();
  };

  const stop = () => {
    if (!isActive) {
      return;
    }
    console.log('killing warmer');
    abortScheduled();
    isActive = false;
    toWarm.length = 0;
  };

  const warmer: Warmer = {
    register,
    stop,
  };
  return warmer;
};
