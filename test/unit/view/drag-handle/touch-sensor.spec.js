// @flow
import { type Position } from 'css-box-model';
import { type ReactWrapper } from 'enzyme';
import { canLiftKey, styleKey } from '../../../../src/view/context-keys';
import * as keyCodes from '../../../../src/view/key-codes';
import getWindowScroll from '../../../../src/view/window/get-window-scroll';
import setWindowScroll from '../../../utils/set-window-scroll';
import {
  timeForLongPress,
  forcePressThreshold,
} from '../../../../src/view/use-drag-handle/sensor/create-touch-sensor';
import {
  dispatchWindowEvent,
  dispatchWindowKeyDownEvent,
} from '../../../utils/user-input-util';
import { callbacksCalled, getStubCallbacks } from './util/callbacks';
import {
  createMockEvent,
  isAWindowClickPrevented,
  type MockEvent,
  touchStart,
  windowEscape,
  windowMouseClick,
  windowTouchMove,
  windowTouchEnd,
  windowTouchCancel,
  windowTouchStart,
} from './util/events';
import { getWrapper } from './util/wrappers';
import type { Callbacks } from '../../../../src/view/use-drag-handle/drag-handle-types';

const origin: Position = { x: 0, y: 0 };
let callbacks: Callbacks;
let wrapper: ReactWrapper<*>;

beforeAll(() => {
  requestAnimationFrame.reset();
  jest.useFakeTimers();
});

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  callbacks = getStubCallbacks();
  wrapper = getWrapper(callbacks);
});

afterEach(() => {
  if (wrapper.length) {
    wrapper.unmount();
  }

  console.warn.mockRestore();
  console.error.mockRestore();
});

const start = () => {
  touchStart(wrapper, origin);
  jest.runTimersToTime(timeForLongPress);
};
const end = () => windowTouchEnd();
const move = (point?: Position = { x: 5, y: 20 }) => {
  windowTouchMove(point);
  requestAnimationFrame.step();
};

describe('initiation', () => {
  it('should start a drag on long press', () => {
    const clientSelection: Position = {
      x: 50,
      y: 100,
    };

    touchStart(wrapper, clientSelection);
    jest.runTimersToTime(timeForLongPress);

    expect(callbacks.onLift).toHaveBeenCalledWith({
      clientSelection,
      movementMode: 'FLUID',
    });
  });

  it('should not call preventDefault on the initial touchstart as we are not sure if the user is dragging yet', () => {
    const mockEvent: MockEvent = createMockEvent();

    touchStart(wrapper, origin, 0, mockEvent);

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should not start a drag if the application state does not allow it', () => {
    const customCallbacks: Callbacks = getStubCallbacks();
    const customContext = {
      [styleKey]: 'hello',
      [canLiftKey]: () => false,
    };
    const customWrapper = getWrapper(customCallbacks, customContext);
    const mock: MockEvent = createMockEvent();

    touchStart(customWrapper, origin, 0, mock);
    jest.runTimersToTime(timeForLongPress);

    expect(mock.preventDefault).not.toHaveBeenCalled();
    expect(callbacks.onLift).not.toHaveBeenCalled();
  });
});

describe('drag ending before it started', () => {
  it('should not start a drag before a long press', () => {
    touchStart(wrapper);
    // have not waited long enough
    jest.runTimersToTime(timeForLongPress - 1);

    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
  });

  it('should not prevent the initial touchstart event', () => {
    const mockEvent: MockEvent = createMockEvent();

    touchStart(wrapper, origin, 0, mockEvent);

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should not start a drag if the user moves their finger before a long press', () => {
    touchStart(wrapper);
    const event: Event = windowTouchMove(origin);
    // would normally start a drag
    jest.runTimersToTime(timeForLongPress);

    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
    // letting the movement event flow through - this enables native scrolling
    expect(event.defaultPrevented).toBe(false);
  });

  it('should not start a drag if a touchend is fired', () => {
    touchStart(wrapper);
    // ended before timer finished
    const event: Event = windowTouchEnd();
    // flush all timers
    jest.runAllTimers();

    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
    expect(event.defaultPrevented).toBe(false);
  });

  it('should not start a drag if a touchcancel is fired', () => {
    touchStart(wrapper);
    // cancelled before timer finished
    const event: Event = windowTouchCancel();
    // flush all timers
    jest.runAllTimers();

    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
    expect(event.defaultPrevented).toBe(false);
  });

  it('should not start a drag if a touchstart is fired', () => {
    touchStart(wrapper);
    // this should not be possible - but testing it anyway
    const event: Event = windowTouchStart();
    // flush all timers
    jest.runAllTimers();

    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
    expect(event.defaultPrevented).toBe(false);
  });

  it('should not start a drag after a resize', () => {
    touchStart(wrapper);
    // resize before timer finished
    const event: Event = dispatchWindowEvent('resize');
    // flush all timers
    jest.runAllTimers();

    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
    expect(event.defaultPrevented).toBe(false);
  });

  it('should not start a drag after a orientation change', () => {
    touchStart(wrapper);
    const event: Event = dispatchWindowEvent('orientationchange');
    // flush all timers
    jest.runAllTimers();

    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
    expect(event.defaultPrevented).toBe(false);
  });

  it('should not start a drag after a window scroll', () => {
    touchStart(wrapper);
    const event: Event = dispatchWindowEvent('scroll');
    // flush all timers
    jest.runAllTimers();

    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
    expect(event.defaultPrevented).toBe(false);
  });

  it('should not start a drag if unmounted', () => {
    touchStart(wrapper);
    wrapper.unmount();

    // flush all timers
    jest.runAllTimers();

    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
  });

  it('should not start if any keypress is made', () => {
    Object.keys(keyCodes).forEach((key: string) => {
      // start a pending drag
      touchStart(wrapper);

      // should cancel the pending drag without preventing the default action
      const event: KeyboardEvent = dispatchWindowKeyDownEvent(keyCodes[key]);

      // would normally start a drag
      jest.runAllTimers();

      expect(
        callbacksCalled(callbacks)({
          onLift: 0,
        }),
      ).toBe(true);
      expect(event.defaultPrevented).toBe(false);
    });
  });
});

describe('progress', () => {
  it('should schedule a move to the new position', () => {
    const target: Position = { x: 100, y: 50 };

    start();
    const event: Event = windowTouchMove(target);

    // scheduled move has not yet occurred
    expect(callbacks.onMove).not.toHaveBeenCalled();

    // releasing the movement
    requestAnimationFrame.step();
    expect(callbacks.onMove).toHaveBeenCalledWith(target);
    // directly using the event as a part of the drag
    expect(event.defaultPrevented).toBe(true);
  });

  it('should prevent any context menu from popping', () => {
    start();

    const event: Event = dispatchWindowEvent('contextmenu');

    expect(event.defaultPrevented).toBe(true);
  });

  it('should schedule a window scroll move on window scroll', () => {
    start();

    dispatchWindowEvent('scroll');
    dispatchWindowEvent('scroll');
    dispatchWindowEvent('scroll');

    // not called initially
    expect(callbacks.onWindowScroll).not.toHaveBeenCalled();

    // called after a requestAnimationFrame
    requestAnimationFrame.step();
    expect(callbacks.onWindowScroll).toHaveBeenCalledTimes(1);

    // should not add any additional calls
    requestAnimationFrame.flush();
    expect(callbacks.onWindowScroll).toHaveBeenCalledTimes(1);
  });
});

describe('dropping', () => {
  it('should drop a drag on touchend', () => {
    touchStart(wrapper);
    jest.runTimersToTime(timeForLongPress);
    const event: Event = windowTouchEnd();

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onDrop: 1,
      }),
    ).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it('should not execute pending movements after a drop', () => {
    touchStart(wrapper);
    jest.runTimersToTime(timeForLongPress);

    // move started but frame not released
    windowTouchMove({ x: 0, y: 100 });

    // finish the drag
    windowTouchEnd();
    expect(
      callbacksCalled(callbacks)({
        // no movement
        onMove: 0,
        onLift: 1,
        onDrop: 1,
      }),
    ).toBe(true);

    requestAnimationFrame.flush();
    expect(
      callbacksCalled(callbacks)({
        // still no movement
        onMove: 0,
        onLift: 1,
        onDrop: 1,
      }),
    ).toBe(true);
  });
});

describe('disabling a draggable during a drag', () => {
  beforeEach(start);

  it('should cancel a drag if it is disabled mid drag', () => {
    wrapper.setProps({
      isEnabled: false,
    });

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
  });

  it('should drop any pending movements', () => {
    expect(callbacks.onMove).not.toHaveBeenCalled();

    wrapper.setProps({ isEnabled: false });
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);

    // would normally flush the movement
    requestAnimationFrame.flush();
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
  });

  // TODO: fix
  it('should drop any pending window scrolls', () => {
    const original: Position = getWindowScroll();
    setWindowScroll(
      {
        x: 100,
        y: 200,
      },
      { shouldPublish: true },
    );
    expect(callbacks.onWindowScroll).not.toHaveBeenCalled();

    wrapper.setProps({ isEnabled: false });
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);

    // would normally flush the windowScroll
    requestAnimationFrame.flush();
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
        onWindowScroll: 0,
      }),
    ).toBe(true);

    setWindowScroll(original, { shouldPublish: false });
  });

  it('should prevent the next click event', () => {
    start();

    // cancel drag
    const keyDownEvent: KeyboardEvent = windowEscape();
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);

    // post drag
    const moveEvent: Event = windowTouchMove();
    const endEvent: Event = windowTouchEnd();
    // and a click
    const clickEvent: MouseEvent = windowMouseClick();

    // a direct cancel has its default action prevented
    expect(keyDownEvent.defaultPrevented).toBe(true);
    // events no longer being controlled
    expect(moveEvent.defaultPrevented).toBe(false);
    expect(endEvent.defaultPrevented).toBe(false);
    // but we still block the final click
    expect(clickEvent.defaultPrevented).toBe(true);
  });

  it('should cancel a drag if unmounted', () => {
    wrapper.unmount();

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
  });

  describe('cancelled elsewhere in the app', () => {
    it('should end the drag without firing the onCancel callback', () => {
      wrapper.setProps({
        isDragging: true,
      });

      // cancelled mid drag
      wrapper.setProps({
        isDragging: false,
      });

      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 0,
        }),
      ).toBe(true);

      // should have no impact
      const event: Event = windowTouchMove({ x: 100, y: 200 });
      requestAnimationFrame.step();

      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 0,
        }),
      ).toBe(true);
      expect(event.defaultPrevented).toBe(false);
    });
  });

  it('should cancel the drag if a touchcancel is fired', () => {
    const event: Event = windowTouchCancel();

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
    // a direct cancel
    expect(event.defaultPrevented).toBe(true);
  });

  it('should cancel the drag after a resize', () => {
    const event: Event = dispatchWindowEvent('resize');

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
    // an indirect cancel
    expect(event.defaultPrevented).toBe(false);
  });

  it('should cancel the drag after a orientation change', () => {
    const event: Event = dispatchWindowEvent('orientationchange');

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
    // an indirect cancel
    expect(event.defaultPrevented).toBe(false);
  });

  it('should cancel a drag if any keypress is made', () => {
    // end initial drag
    end();
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onDrop: 1,
      }),
    ).toBe(true);

    Object.keys(keyCodes).forEach((key: string, index: number) => {
      // start drag
      start();

      // should kill the drag
      const event: KeyboardEvent = dispatchWindowKeyDownEvent(keyCodes[key]);

      expect(
        callbacksCalled(callbacks)({
          // initial lift + index + 1
          onLift: index + 2,
          // index + 1
          onCancel: index + 1,
          // initial drop
          onDrop: 1,
        }),
      ).toBe(true);

      // direct cancel
      if (keyCodes[key] === keyCodes.escape) {
        expect(event.defaultPrevented).toBe(true);
        return;
      }
      // indirect cancel
      expect(event.defaultPrevented).toBe(false);
    });
  });

  it('should cancel if a touchstart event is fired', () => {
    const event: Event = windowTouchStart();

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
    // this is an error situation - a touchstart should not be able
    // to be called before a touchcancel or touchend
    expect(event.defaultPrevented).toBe(false);
  });

  it('should not execute pending movements after a cancel', () => {
    touchStart(wrapper);
    jest.runTimersToTime(timeForLongPress);

    // move started but frame not released
    windowTouchMove({ x: 0, y: 100 });

    // cancel the drag
    dispatchWindowEvent('orientationchange');
    expect(
      callbacksCalled(callbacks)({
        // no movement
        onMove: 0,
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);

    requestAnimationFrame.flush();
    expect(
      callbacksCalled(callbacks)({
        // still no movement
        onMove: 0,
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
  });
});

describe('force press', () => {
  const windowForcePress = (force?: number = forcePressThreshold): Event =>
    dispatchWindowEvent('touchforcechange', {
      touches: [
        {
          force,
        },
      ],
    });

  describe('force touch respected', () => {
    describe('drag not yet started', () => {
      it('should not start a drag if a force press occurs', () => {
        touchStart(wrapper);
        const event: Event = windowForcePress(forcePressThreshold);
        // would normally start a drag
        jest.runAllTimers();

        expect(
          callbacksCalled(callbacks)({
            onLift: 0,
          }),
        ).toBe(true);
        // This is an indirect cancel
        expect(event.defaultPrevented).toBe(false);
      });

      it('should not block lifting if the force press is not strong enough', () => {
        touchStart(wrapper);
        windowForcePress(forcePressThreshold - 0.1);
        // would normally start a drag
        jest.runAllTimers();

        expect(
          callbacksCalled(callbacks)({
            onLift: 1,
          }),
        ).toBe(true);
      });

      it('should block lifting if the force press is strong enough', () => {
        touchStart(wrapper);
        windowForcePress(forcePressThreshold);
        // would normally start a drag
        jest.runAllTimers();

        expect(
          callbacksCalled(callbacks)({
            onLift: 0,
          }),
        ).toBe(true);
      });
    });

    describe('drag started', () => {
      it('should cancel the drag if no movement has occurred yet', () => {
        start();
        const event: Event = windowForcePress();

        expect(
          callbacksCalled(callbacks)({
            onLift: 1,
            onCancel: 1,
          }),
        ).toBe(true);
        // we are not preventing the force press
        expect(event.defaultPrevented).toBe(false);
      });

      describe('force press after drag movement', () => {
        // This situation should not be possible, but we are being extra careful

        it('should not cancel the drag', () => {
          start();
          windowTouchMove({ x: 10, y: 20 });
          // drag has started
          windowForcePress();

          expect(
            callbacksCalled(callbacks)({
              onLift: 1,
              onCancel: 0,
            }),
          ).toBe(true);
        });

        it('should prevent a force press action', () => {
          start();
          windowTouchMove({ x: 10, y: 20 });

          const weak: Event = windowForcePress(0);
          const strong: Event = windowForcePress(forcePressThreshold);

          // does not matter what type of force press
          expect(weak.defaultPrevented).toBe(true);
          expect(strong.defaultPrevented).toBe(true);
        });
      });
    });
  });

  describe('force touch not respected', () => {
    let customCallbacks: Callbacks;
    let notRespected: ReactWrapper<*>;
    beforeEach(() => {
      customCallbacks = getStubCallbacks();
      notRespected = getWrapper(
        customCallbacks,
        undefined,
        // should not respect force touch
        false,
      );
    });

    afterEach(() => {
      notRespected.unmount();
    });

    it('should not cancel a lift if a force press is fired while a lift is pending', () => {
      touchStart(notRespected);
      // would cancel a pending drag if force touch is respected
      windowForcePress(forcePressThreshold);
      jest.runAllTimers();

      expect(
        callbacksCalled(customCallbacks)({
          onLift: 1,
        }),
      ).toBe(true);
    });

    it('should not cancel a drag if a force press occurs during a drag (before movement)', () => {
      // drag started but no movement yet
      touchStart(notRespected);
      jest.runAllTimers();
      expect(
        callbacksCalled(customCallbacks)({
          onLift: 1,
        }),
      ).toBe(true);

      // not cancelling the drag with a force press
      windowForcePress(forcePressThreshold);
      expect(
        callbacksCalled(customCallbacks)({
          onLift: 1,
          onCancel: 0,
        }),
      ).toBe(true);
    });

    it('should not cancel a drag if a force press occurs during a drag (after movement)', () => {
      // drag started
      touchStart(notRespected);
      jest.runAllTimers();
      expect(
        callbacksCalled(customCallbacks)({
          onLift: 1,
        }),
      ).toBe(true);

      // movement
      move({ x: 10, y: 20 });
      expect(
        callbacksCalled(customCallbacks)({
          onLift: 1,
          onMove: 1,
        }),
      ).toBe(true);

      // not cancelling the drag with a force press
      windowForcePress(forcePressThreshold);
      expect(
        callbacksCalled(customCallbacks)({
          onLift: 1,
          onMove: 1,
          onCancel: 0,
        }),
      ).toBe(true);
    });
  });
});

it('should allow standard tap interactions', () => {
  const mockEvent: MockEvent = createMockEvent();

  touchStart(wrapper, { x: 0, y: 0 }, 0, mockEvent);
  const endEvent: Event = windowTouchEnd();

  // flush any timers
  jest.runAllTimers();

  // initial touch start not prevented
  expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  // end of lift not prevented
  expect(endEvent.defaultPrevented).toBe(false);
});

describe('click prevention', () => {
  it('should prevent a click if a drag has occurred', () => {
    start();
    end();

    expect(isAWindowClickPrevented()).toBe(true);
  });

  it('should not prevent a click if no drag has occurred', () => {
    touchStart(wrapper);
    // drag has not started yet
    expect(callbacks.onLift).not.toHaveBeenCalled();
    // drag ended
    end();
    // then a click
    expect(isAWindowClickPrevented()).toBe(false);
  });

  it('should only prevent a single click', () => {
    start();
    end();

    // first click prevented
    expect(isAWindowClickPrevented()).toBe(true);

    // second click not prevented
    expect(isAWindowClickPrevented()).toBe(false);
  });

  it('should prevent a click after a drag even if some time has ellapsed', () => {
    start();
    end();

    jest.runTimersToTime(10);

    // click is not prevented now
    expect(isAWindowClickPrevented()).toBe(true);
  });

  it('should not prevent clicks on subsequent unsuccessful drags', () => {
    // first drag
    start();
    end();
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onDrop: 1,
      }),
    ).toBe(true);

    // second drag start unsuccessful
    // manually firing a window touch event as enzyme will not
    // publish the synthetic event up the tree
    touchStart(wrapper);
    windowTouchStart();
    end();
    // no lift or drop occurred
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onDrop: 1,
      }),
    ).toBe(true);

    // click after unsuccessful drag is not prevented
    expect(isAWindowClickPrevented()).toBe(false);
  });
});

describe('subsequent drags', () => {
  it('should be possible to do another drag after one finishes', () => {
    Array.from({ length: 10 }, (v, k) => k).forEach((val: number) => {
      start();
      // moves are memoized
      move({ x: 0, y: val });
      end();

      expect(
        callbacksCalled(callbacks)({
          onLift: val + 1,
          onMove: val + 1,
          onDrop: val + 1,
        }),
      ).toBe(true);
    });
  });
});
