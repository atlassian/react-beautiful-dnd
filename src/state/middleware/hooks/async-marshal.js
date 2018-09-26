// @flow
export default () => {
  const timerIds: TimeoutID[] = [];
  const callbacks: Function[] = [];

  const add = (fn: Function) => {
    callbacks.push(fn);
    // index will be the same for callbacks and timerIds
    const index: number = callbacks.length - 1;

    const timerId: TimeoutID = setTimeout(() => {
      console.log('timeout fired');
      // delete in place
      timerIds.splice(index, 1);
      const [callback] = callbacks.splice(index, 1);
      callback();
    });
    timerIds.push(timerId);
  };

  const flush = () => {
    if (!callbacks.length) {
      return;
    }

    const fns: Function[] = [...callbacks];

    // clearing existing contents before calling fns
    callbacks.length = 0;
    timerIds.length = 0;
    fns.forEach(fn => fn());
  };

  return { add, flush };
};
