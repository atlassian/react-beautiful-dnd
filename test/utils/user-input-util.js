import { ReactWrapper } from 'enzyme';

const primaryButton: number = 0;

export const dispatchWindowMouseEvent = (
  eventName: string,
  clientX?: number = 0,
  clientY?: number = 0,
  button?: number = primaryButton,
): MouseEvent => {
  const event = new window.MouseEvent(eventName, {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX,
    clientY,
    button,
  });
  window.dispatchEvent(event);
  return event;
};

export const dispatchWindowKeyDownEvent = (
  keyCode: number,
): KeyboardEvent => {
  const event = new window.KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    keyCode,
  });
  window.dispatchEvent(event);
  return event;
};

export const mouseEvent = (
  eventName: string,
  wrapper: ReactWrapper<any>,
  clientX?: number = 0,
  clientY?: number = 0,
  button?: number = primaryButton,
  options?: Object = {},
): void => wrapper.simulate(eventName, { button, clientX, clientY, ...options });

export const liftWithMouse = (
  wrapper: ReactWrapper<any>,
  clientX?: number = 0,
  clientY?: number = 0,
  button?: number = primaryButton,
  options?: Object = {},
): void =>
  wrapper.simulate('mousedown', { button, clientX, clientY, ...options });

export const withKeyboard = (keyCode: number): Function =>
  (wrapper: ReactWrapper<any>, options?: Object = {}) =>
    wrapper.simulate('keydown', { keyCode, ...options });
