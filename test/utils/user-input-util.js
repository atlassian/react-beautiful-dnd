import { ReactWrapper } from 'enzyme';
import { Position } from '../../src/types';

const primaryButton: number = 0;

const getTouch = (client: Position, force: number): Touch => {
  const touch: Touch = new window.Touch({
    // const touch: Touch = {
    identifier: Date.now(),
    // being super generic here
    target: window,
    clientX: client.x,
    clientY: client.y,
    radiusX: 2.5,
    radiusY: 2.5,
    rotationAngle: 0,
    force,
  });

  return touch;
};

export const dispatchWindowMouseEvent = (
  eventName: string,
  clientX?: number = 0,
  clientY?: number = 0,
  button?: number = primaryButton,
  options?: Object = {},
): MouseEvent => {
  const event = new window.MouseEvent(eventName, {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX,
    clientY,
    button,
  });

  // override properties on the event itself
  Object.assign(event, options);

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

export const dispatchWindowTouchEvent = (
  eventName: string,
  client?: Position = { x: 0, y: 0 },
  force?: number = 0,
  options?: Object = {},
): TouchEvent => {
  const touch: Touch = getTouch(client, force);
  const event: TouchEvent = new window.TouchEvent(eventName, {
    bubbles: true,
    cancelable: true,
    touches: [touch],
    targetTouches: [],
    changedTouches: [touch],
    shiftKey: false,
  });

  // override properties on the event itself
  Object.assign(event, options);

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

export const touchEvent = (
  eventName: string,
  wrapper: ReactWrapper<any>,
  client?: Position = { x: 0, y: 0 },
  force?: number = 0,
  options?: Object = {},
): void => {
  const touches: Touch[] = [
    getTouch(client, force),
  ];

  wrapper.simulate(eventName, { touches, ...options });
};

