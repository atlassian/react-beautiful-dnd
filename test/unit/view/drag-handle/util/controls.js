// @flow
import type { ReactWrapper } from 'enzyme';
import { sloppyClickThreshold } from '../../../../../src/view/use-drag-handle/util/is-sloppy-click-threshold-exceeded';
import { timeForLongPress } from '../../../../../src/view/use-drag-handle/sensor/create-touch-sensor';
import {
  primaryButton,
  touchStart,
  windowTouchEnd,
  windowMouseClick,
  pressSpacebar,
  mouseDown,
  windowMouseMove,
  windowMouseUp,
  pressArrowDown,
  windowTouchMove,
} from './events';

export type Control = {|
  name: string,
  hasPostDragClickBlocking: boolean,
  hasPreLift: boolean,
  preLift: (wrap: ReactWrapper<*>, options?: Object) => void,
  lift: (wrap: ReactWrapper<*>, options?: Object) => void,
  move: (wrap: ReactWrapper<*>) => void,
  drop: (wrap: ReactWrapper<*>) => void,
  cleanup: () => void,
|};

// using the class rather than the attribute as the attribute will not be present when disabled
const getDragHandle = (wrapper: ReactWrapper<*>) =>
  wrapper.find('.drag-handle');

export const touch: Control = {
  name: 'touch',
  hasPostDragClickBlocking: true,
  hasPreLift: true,
  preLift: (wrapper: ReactWrapper<*>, options?: Object = {}) =>
    touchStart(getDragHandle(wrapper), { x: 0, y: 0 }, 0, options),
  lift: (wrapper: ReactWrapper<*>) => {
    jest.runTimersToTime(timeForLongPress);
    wrapper.setProps({ isDragging: true });
  },
  move: () => {
    windowTouchMove({ x: 100, y: 200 });
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
  hasPreLift: false,
  // no pre lift required
  preLift: () => {},
  lift: (wrap: ReactWrapper<*>, options?: Object = {}) => {
    pressSpacebar(getDragHandle(wrap), options);
    wrap.setProps({ isDragging: true });
  },
  move: (wrap: ReactWrapper<*>) => {
    pressArrowDown(getDragHandle(wrap));
  },
  drop: (wrap: ReactWrapper<*>) => {
    // only want to fire the event if dragging - otherwise it might start a drag
    if (wrap.props().isDragging) {
      pressSpacebar(getDragHandle(wrap));
    }
  },
  // no cleanup required
  cleanup: () => {},
};

export const mouse: Control = {
  name: 'mouse',
  hasPostDragClickBlocking: true,
  hasPreLift: true,
  preLift: (wrap: ReactWrapper<*>, options?: Object = {}) => {
    mouseDown(getDragHandle(wrap), { x: 0, y: 0 }, primaryButton, options);
  },
  lift: (wrap: ReactWrapper<*>) => {
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    wrap.setProps({ isDragging: true });
  },
  move: () => {
    windowMouseMove({ x: 100, y: 200 });
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
