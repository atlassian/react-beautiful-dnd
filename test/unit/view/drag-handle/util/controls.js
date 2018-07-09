// @flow
import invariant from 'tiny-invariant';
import type { ReactWrapper } from 'enzyme';
import { sloppyClickThreshold } from '../../../../../src/view/drag-handle/util/is-sloppy-click-threshold-exceeded';
import { timeForLongPress } from '../../../../../src/view/drag-handle/sensor/create-touch-sensor';
import {
  primaryButton,
  touchStart,
  windowTouchEnd,
  windowMouseClick,
  pressSpacebar,
  mouseDown,
  windowMouseMove,
  windowMouseUp,
} from './events';

export type Control = {|
  name: string,
  hasPostDragClickBlocking: boolean,
  preLift: (wrap: ReactWrapper, options?: Object) => void,
  lift: (wrap: ReactWrapper, options?: Object) => void,
  drop: (wrap: ReactWrapper) => void,
  cleanup: () => void,
|};

const trySetIsDragging = (wrapper: ReactWrapper) => {
  // potentially not looking at the root wrapper
  if (!wrapper.props().callbacks) {
    return;
  }

  // lift was not successful - this can happen when not allowed to lift
  if (!wrapper.props().callbacks.onLift.mock.calls.length) {
    return;
  }
  // would be set during a drag
  wrapper.setProps({ isDragging: true });
};

export const touch: Control = {
  name: 'touch',
  hasPostDragClickBlocking: true,
  preLift: (wrapper: ReactWrapper, options?: Object = {}) =>
    touchStart(wrapper, { x: 0, y: 0 }, 0, options),
  lift: (wrapper: ReactWrapper) => {
    jest.runTimersToTime(timeForLongPress);
    trySetIsDragging(wrapper);
  },
  drop: () => {
    windowTouchEnd();
  },
  cleanup: () => {
    windowMouseClick();
  },
};

export const keyboard: Control = {
  name: 'keyboard',
  hasPostDragClickBlocking: false,
  // no pre lift required
  preLift: () => {},
  lift: (wrap: ReactWrapper, options?: Object = {}) => {
    pressSpacebar(wrap, options);
    trySetIsDragging(wrap);
  },
  drop: (wrap: ReactWrapper) => {
    // only want to fire the event if dragging - otherwise it might start a drag
    if (wrap.props().isDragging) {
      pressSpacebar(wrap);
    }
  },
  // no cleanup required
  cleanup: () => {},
};

export const mouse: Control = {
  name: 'mouse',
  hasPostDragClickBlocking: true,
  preLift: (wrap: ReactWrapper, options?: Object = {}) =>
    mouseDown(wrap, { x: 0, y: 0 }, primaryButton, options),
  lift: (wrap: ReactWrapper) => {
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    trySetIsDragging(wrap);
  },
  drop: () => {
    windowMouseUp();
  },
  cleanup: () => {
    windowMouseClick();
  },
};

export const controls: Control[] = [mouse, keyboard, touch];

export const forEach = (fn: (control: Control) => void) => {
  controls.forEach((control: Control) => {
    describe(`with: ${control.name}`, () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });
      afterEach(() => {
        control.cleanup();
        jest.clearAllTimers();
        jest.useRealTimers();
      });

      fn(control);
    });
  });
};
