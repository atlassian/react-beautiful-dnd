// @flow

type CancelFn = () => void;

const isSupported: boolean = Boolean(requestIdleCallback && cancelIdleCallback);
const noop: CancelFn = () => {};

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
  let warmUpId: ?IdleCallbackID = requestIdleCallback(() => {
    warmUpId = null;

    let callCount = 0;
    const start: number = Date.now();

    // trying to get to 10 calls
    // only allowing one millisecond of operations
    while (callCount < 10 && Date.now() - start < 1) {
      fn();
      callCount++;
    }
  });

  // A warmup can be cancelled if it is no longer needed:
  // - when the component is being unmounted
  // - a lift is occurring
  const cancel: CancelFn = () => {
    if (!warmUpId) {
      return;
    }
    // console.log('cancelling warm up');
    cancelIdleCallback(warmUpId);
    warmUpId = null;
  };

  return cancel;
};
