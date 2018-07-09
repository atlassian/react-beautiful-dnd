// @flow
import {
  dispatchWindowMouseEvent,
  dispatchWindowKeyDownEvent,
  dispatchWindowTouchEvent,
  mouseEvent,
  touchEvent,
  withKeyboard,
} from '../../../../utils/user-input-util';
import * as keyCodes from '../../../../../src/view/key-codes';

export const primaryButton: number = 0;
export const auxiliaryButton: number = 1;

// mouse events
export const windowMouseUp = dispatchWindowMouseEvent.bind(null, 'mouseup');
export const windowMouseDown = dispatchWindowMouseEvent.bind(null, 'mousedown');
export const windowMouseMove = dispatchWindowMouseEvent.bind(null, 'mousemove');
export const windowMouseClick = dispatchWindowMouseEvent.bind(null, 'click');
export const mouseDown = mouseEvent.bind(null, 'mousedown');
export const mouseClick = mouseEvent.bind(null, 'click');
// keyboard events
export const pressSpacebar = withKeyboard(keyCodes.space);
export const windowSpacebar = dispatchWindowKeyDownEvent.bind(
  null,
  keyCodes.space,
);
export const pressArrowDown = withKeyboard(keyCodes.arrowDown);
export const pressArrowUp = withKeyboard(keyCodes.arrowUp);
export const pressArrowRight = withKeyboard(keyCodes.arrowRight);
export const pressArrowLeft = withKeyboard(keyCodes.arrowLeft);
export const pressEscape = withKeyboard(keyCodes.escape);
export const windowEscape = dispatchWindowKeyDownEvent.bind(
  null,
  keyCodes.escape,
);
export const pressTab = withKeyboard(keyCodes.tab);
export const windowTab = dispatchWindowKeyDownEvent.bind(null, keyCodes.tab);
export const pressEnter = withKeyboard(keyCodes.enter);
export const windowEnter = dispatchWindowKeyDownEvent.bind(
  null,
  keyCodes.enter,
);
// touch events
export const touchStart = touchEvent.bind(null, 'touchstart');
export const windowTouchStart = dispatchWindowTouchEvent.bind(
  null,
  'touchstart',
);
export const windowTouchMove = dispatchWindowTouchEvent.bind(null, 'touchmove');
export const windowTouchEnd = dispatchWindowTouchEvent.bind(null, 'touchend');
export const windowTouchCancel = dispatchWindowTouchEvent.bind(
  null,
  'touchcancel',
);

export type MockEvent = {|
  preventDefault: Function,
|};

export const createMockEvent = (): MockEvent => ({
  preventDefault: jest.fn(),
});

export const isAWindowClickPrevented = (): boolean => {
  const event: Event = windowMouseClick();
  return event.defaultPrevented;
};
