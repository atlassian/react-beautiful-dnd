// @flow

type CancelFn = () => void;

const isSupported: boolean =
  typeof window !== 'undefined' &&
  typeof requestIdleCallback !== 'undefined' &&
  typeof cancelAnimationFrame !== 'undefined';
const noop: CancelFn = () => {};

// Flow does not have this type so I am making it here
// https://developer.mozilla.org/en-US/docs/Web/API/IdleDeadline
type IdleDeadline = {
  timeRemaining: () => number,
  didTimeout: boolean,
};

// Calculating a dimension on lift can be expensive (30ms for 500 on a powerful machine)
// In order to reduce this cost we try to make the associated dimension collecting functions 'hot'
// before a lift.
export default (fn: () => mixed): CancelFn => {
  if (!isSupported) {
    return noop;
  }

  // We are using requestIdleCallback as this is a super low
  // priority piece of work for the browser and we do not want
  // to impact other operations on the page
  let warmUpId: ?IdleCallbackID = requestIdleCallback(
    (deadline: IdleDeadline) => {
      warmUpId = null;

      let callCount = 0;
      const start: number = Date.now();

      while (
        // trying to get to 10 calls
        callCount < 10 &&
        // only allowing a max of five milliseconds of operations
        Date.now() - start < 5 &&
        // super safe: making sure we do not exceed the allowed time
        deadline.timeRemaining() > 0
      ) {
        fn();
        callCount++;
      }
    },
  );

  // A warmup can be cancelled if it is no longer needed:
  // - when the component is being unmounted
  // - a lift is occurring
  const cancel: CancelFn = () => {
    if (!warmUpId) {
      return;
    }
    cancelIdleCallback(warmUpId);
    warmUpId = null;
  };

  return cancel;
};
