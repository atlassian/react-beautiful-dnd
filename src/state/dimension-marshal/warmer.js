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

let totalTime: number = 0;

export default () => {
  if (!isSupported) {
    return empty;
  }
  // return empty;
  let isActive: boolean = true;
  const warmUpIds: IdleCallbackID[] = [];

  const schedule = (fn: Function) => {
    const id: IdleCallbackID = requestIdleCallback((deadline: IdleDeadline) => {
      const index: number = warmUpIds.indexOf(id);
      warmUpIds.splice(index, 1);

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

      // console.log('warmer did work', callCount);
      totalTime += Date.now() - start;
      console.log('total time', totalTime);
    });
    warmUpIds.push(id);
  };

  const register = (fn: Function) => {
    if (!isActive) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Cannot register more warm up work when no longer active');
      }
      return;
    }
    schedule(fn);
  };

  const stop = () => {
    if (!isActive) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('warmer.stop() called, but it is already stopped');
      }
      return;
    }
    isActive = false;
    if (!warmUpIds.length) {
      return;
    }
    warmUpIds.forEach((id: IdleCallbackID) => cancelIdleCallback(id));
    warmUpIds.length = 0;
  };

  const warmer: Warmer = {
    register,
    stop,
  };
  return warmer;
};
