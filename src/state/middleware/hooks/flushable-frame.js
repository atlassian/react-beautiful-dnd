// @flow

export type FlushableFrame = {
  cancel: () => void,
  flush: () => void,
};

export default (fn: Function): FlushableFrame => {
  let frameId: ?AnimationFrameID = requestAnimationFrame(() => {
    frameId = null;
    fn();
  });

  const cancel = () => {
    if (!frameId) {
      return;
    }
    cancelAnimationFrame(frameId);
    frameId = null;
  };

  const flush = () => {
    // frame already executed - nothing to flush
    if (!frameId) {
      return;
    }

    cancel();
    fn();
  };

  return { cancel, flush };
};
