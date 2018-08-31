// @flow
/* eslint-disable no-use-before-define */
type WarmFn = Function;

const workBuffer: number = 5;

export default () => {
  const queue: WarmFn[] = [];
  let frameId: ?AnimationFrameID = null;

  const schedule = () => {
    if (frameId) {
      return;
    }
    console.log('scheduling warm up');
    frameId = requestAnimationFrame(() => {
      frameId = null;
      run(performance.now());
    });
  };

  const run = (startTime: number) => {
    // console.log('warming up');
    const warmUp: WarmFn = queue.shift();
    warmUp();

    // all finished
    if (!queue.length) {
      return;
    }

    const now: number = performance.now();

    const timePassed: number = now - startTime;
    console.log('time passed', timePassed);

    // we have run out of time - schedule another block of work
    if (timePassed > workBuffer) {
      console.log('buffer exceeded - scheduling new');
      schedule();
      return;
    }

    // console.log('running another');
    run(startTime);
  };

  const register = (fn: WarmFn) => {
    queue.push(fn);
    schedule();
  };

  const unregister = (fn: WarmFn) => {
    const index: number = queue.indexOf(fn);

    // already finished
    if (index === -1) {
      return;
    }

    // remove item from array
    queue.splice(index, 1);
  };

  const abort = () => {
    if (!frameId) {
      return;
    }
    cancelAnimationFrame(frameId);
    frameId = null;
  };

  return {
    register,
    unregister,
    abort,
  };
};
