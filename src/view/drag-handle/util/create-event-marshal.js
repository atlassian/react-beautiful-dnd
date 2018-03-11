// @flow

export type EventMarshal = {|
  handle: () => void,
  isHandled: () => boolean,
  reset: () => void,
|}

export default (): EventMarshal => {
  let isMouseDownHandled: boolean = false;
  let handleTimeoutId: ?number = null;

  const isHandled = (): boolean => isMouseDownHandled;

  const clearTimeoutIfNeeded = (): void => {
    if (handleTimeoutId == null) {
      return;
    }

    clearTimeout(handleTimeoutId);
    handleTimeoutId = null;
  };

  const reset = (): void => {
    clearTimeoutIfNeeded();
    isMouseDownHandled = false;
  };

  const handle = (): void => {
    if (isMouseDownHandled) {
      console.error('Cannot handle mouse down as it is already handled');
      return;
    }

    isMouseDownHandled = true;

    clearTimeoutIfNeeded();
    handleTimeoutId = setTimeout(reset);
  };

  return {
    handle,
    isHandled,
    // This is not strictly needed given that we use the setTimeout to clear this
    // However, add it makes testing way more explicit
    reset,
  };
};
