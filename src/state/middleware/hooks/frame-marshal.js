// @flow
import invariant from 'tiny-invariant';

export type FrameMarshal = {|
  flush: () => void,
  add: (fn: Function) => void,
|};

export default (): FrameMarshal => {
  let last: ?Function = null;
  let frameId: ?AnimationFrameID = null;

  const exhaust = () => {
    invariant(last, 'Cannot execute fn as none was found');
    // calling fn after resetting the state
    // this is because fn() may end up triggering a flush
    // and setting last. If we then clear it after the fn
    // call then the fn is lost
    const fn: Function = last;
    last = null;
    fn();
  };

  const flush = () => {
    if (!frameId) {
      return;
    }
    cancelAnimationFrame(frameId);
    frameId = null;
    exhaust();
  };

  const add = (cb: Function) => {
    // flush anything that is pending
    flush();
    last = cb;
    frameId = requestAnimationFrame(() => {
      frameId = null;
      exhaust();
    });
  };

  return { add, flush };
};
