// @flow

export type EventMarshal = {|
  handle: () => void,
  isHandled: () => boolean,
  reset: () => void,
|}

export default (): EventMarshal => {
  let isMouseDownHandled: boolean = false;

  const handle = (): void => {
    if (isMouseDownHandled) {
      console.error('Cannot handle mouse down as it is already handled');
      return;
    }
    isMouseDownHandled = true;
  };

  const isHandled = (): boolean => isMouseDownHandled;

  const reset = (): void => {
    isMouseDownHandled = false;
  };

  return {
    handle,
    isHandled,
    reset,
  };
};
