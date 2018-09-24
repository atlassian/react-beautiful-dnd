// @flow
import invariant from 'tiny-invariant';

export type FrameMarshal = {|
  flush: () => void,
  add: (fn: Function) => void,
|};

export default (): FrameMarshal => {
  let last: ?Function = null;
  let frameId: ?AnimationFrameID = null;

  const execute = () => {
    invariant(last);
    last();
    last = null;
    frameId = null;
  };

  const flush = () => {
    if (!frameId) {
      return;
    }
    cancelAnimationFrame(frameId);
    execute();
  };

  const add = (cb: Function) => {
    flush();
    last = cb;
    frameId = requestAnimationFrame(execute);
  };

  return { add, flush };
};
