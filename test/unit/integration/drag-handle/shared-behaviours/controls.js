// @flow
import { fireEvent, act } from 'react-testing-library';
import { sloppyClickThreshold } from '../../../../../src/view/use-sensor-marshal/sensors/use-mouse-sensor';
import { timeForLongPress } from '../../../../../src/view/use-sensor-marshal/sensors/use-touch-sensor';
import * as keyCodes from '../../../../../src/view/key-codes';

export type Control = {|
  name: string,
  preLift: (handle: HTMLElement) => void,
  lift: (handle: HTMLElement) => void,
  move: (handle: HTMLElement) => void,
  drop: (handle: HTMLElement) => void,
|};

export function simpleLift(control: Control, handle: HTMLElement) {
  control.preLift(handle);
  control.lift(handle);
}

export const mouse: Control = {
  name: 'mouse',
  preLift: (handle: HTMLElement) => {
    fireEvent.mouseDown(handle);
  },
  lift: (handle: HTMLElement) => {
    fireEvent.mouseMove(handle, { clientX: 0, clientY: sloppyClickThreshold });
  },
  move: (handle: HTMLElement) => {
    fireEvent.mouseMove(handle, {
      clientX: 0,
      clientY: sloppyClickThreshold + 1,
    });
    // movements are throttled by raf
    act(() => {
      requestAnimationFrame.step();
    });
  },
  drop: (handle: HTMLElement) => {
    fireEvent.mouseUp(handle);
  },
};

export const keyboard: Control = {
  name: 'keyboard',
  preLift: () => {},
  lift: (handle: HTMLElement) => {
    fireEvent.keyDown(handle, { keyCode: keyCodes.space });
  },
  move: (handle: HTMLElement) => {
    fireEvent.keyDown(handle, {
      keyCode: keyCodes.arrowDown,
    });
  },
  drop: (handle: HTMLElement) => {
    fireEvent.keyDown(handle, { keyCode: keyCodes.space });
  },
};

export const touch: Control = {
  name: 'touch',
  preLift: (handle: HTMLElement) => {
    fireEvent.touchStart(handle, { touches: [{ clientX: 0, clientY: 0 }] });
  },
  lift: () => {
    act(() => {
      jest.runTimersToTime(timeForLongPress);
    });
  },
  move: (handle: HTMLElement) => {
    fireEvent.touchMove(handle, {
      touches: [{ clientX: 0, clientY: 1 }],
    });
    act(() => {
      // movements are throttled by raf
      requestAnimationFrame.step();
    });
  },
  drop: (handle: HTMLElement) => {
    fireEvent.touchEnd(handle);
  },
};

export const controls: Control[] = [mouse, keyboard, touch];

export const forEachSensor = (tests: (control: Control) => void) => {
  controls.forEach((control: Control) => {
    describe(`with: ${control.name}`, () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });
      afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
      });

      tests(control);
    });
  });
};
