// @flow
import { type Position } from 'css-box-model';
import { type ReactWrapper } from 'enzyme';
import { sloppyClickThreshold } from '../../../../src/view/use-drag-handle/util/is-sloppy-click-threshold-exceeded';
import * as keyCodes from '../../../../src/view/key-codes';
import getWindowScroll from '../../../../src/view/window/get-window-scroll';
import setWindowScroll from '../../../utils/set-window-scroll';
import {
  dispatchWindowEvent,
  dispatchWindowKeyDownEvent,
  dispatchWindowMouseEvent,
} from '../../../utils/user-input-util';
import {
  callbacksCalled,
  getStubCallbacks,
  whereAnyCallbacksCalled,
} from './util/callbacks';
import {
  auxiliaryButton,
  createMockEvent,
  isAWindowClickPrevented,
  type MockEvent,
  mouseClick,
  mouseDown,
  pressArrowDown,
  pressArrowUp,
  pressSpacebar,
  primaryButton,
  touchStart,
  windowEnter,
  windowEscape,
  windowMouseClick,
  windowMouseMove,
  windowMouseUp,
  windowSpacebar,
  windowTab,
} from './util/events';
import { getWrapper } from './util/wrappers';
import type { Callbacks } from '../../../../src/view/use-drag-handle/drag-handle-types';
import type { AppContextValue } from '../../../../src/view/context/app-context';
import basicContext from './util/app-context';
import forceUpdate from '../../../utils/force-update';

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

describe('initiation', () => {
  it('should start a drag if there was sufficient mouse movement in any direction', () => {
    const valid: Position[] = [
      { x: 0, y: sloppyClickThreshold },
      { x: 0, y: -sloppyClickThreshold },
      { x: sloppyClickThreshold, y: 0 },
      { x: -sloppyClickThreshold, y: 0 },
    ];

    valid.forEach(
      (point: Position): void => {
        const customCallbacks = getStubCallbacks();
        const customWrapper = getWrapper(customCallbacks);

        mouseDown(customWrapper, origin);
        windowMouseMove(point);

        expect(customCallbacks.onLift).toHaveBeenCalledWith({
          clientSelection: origin,
          movementMode: 'FLUID',
        });

        customWrapper.unmount();
      },
    );
  });

  it('should not interfere with standard click events', () => {
    const mock = jest.fn();

    mouseClick(wrapper, origin, primaryButton, { preventDefault: mock });

    expect(mock).not.toHaveBeenCalled();
  });

  it('should call preventDefault on the initial mousedown event to prevent the element gaining focus', () => {
    const mockEvent: MockEvent = createMockEvent();

    mouseDown(wrapper, origin, primaryButton, mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should not call preventDefault on mouse movements while we are not sure if a drag is starting', () => {
    mouseDown(wrapper);

    const event: MouseEvent = windowMouseMove({
      x: 0,
      y: sloppyClickThreshold - 1,
    });

    expect(event.defaultPrevented).toBe(false);
  });

  it('should call preventDefault on the mouse move that starts a drag', () => {
    mouseDown(wrapper);

    // not enough to start a drag
    const first: MouseEvent = windowMouseMove({
      x: 0,
      y: sloppyClickThreshold - 1,
    });
    // enough movement to start a drag
    const second: MouseEvent = windowMouseMove({
      x: 0,
      y: sloppyClickThreshold,
    });

    expect(first.defaultPrevented).toBe(false);
    expect(second.defaultPrevented).toBe(true);
  });

  it('should not start a drag if there was no mouse movement while mouse was pressed', () => {
    mouseDown(wrapper);
    windowMouseUp();

    expect(whereAnyCallbacksCalled(callbacks)).toBe(false);
  });

  it('should not start a drag if there was too little mouse movement while mouse was pressed', () => {
    mouseDown(wrapper, origin);
    windowMouseMove({ x: 0, y: sloppyClickThreshold - 1 });
    windowMouseUp({ x: 0, y: sloppyClickThreshold - 1 });

    expect(whereAnyCallbacksCalled(callbacks)).toBe(false);
  });

  it('should not start a drag if not using the primary mouse button', () => {
    mouseDown(wrapper, origin, auxiliaryButton);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });

    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
  });

  it('should not start a drag if a modifier key was used while pressing the mouse down', () => {
    // if any drag is started with these keys pressed then we do not start a drag
    const withKeys = [
      { ctrlKey: true },
      { altKey: true },
      { shiftKey: true },
      { metaKey: true },
    ];

    withKeys.forEach((withKey: Object) => {
      mouseDown(wrapper, origin, primaryButton, withKey);
      windowMouseMove({ x: 0, y: sloppyClickThreshold });
      windowMouseUp();

      expect(
        callbacksCalled(callbacks)({
          onLift: 0,
        }),
      ).toBe(true);
    });
  });

  it('should not start a drag if another sensor is capturing', () => {
    // will now be capturing
    touchStart(wrapper);

    // lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });

    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
  });

  it('should not start a drag if the state says that a drag cannot start', () => {
    const customCallbacks: Callbacks = getStubCallbacks();
    const customContext: AppContextValue = {
      ...basicContext,
      canLift: () => false,
    };
    const customWrapper = getWrapper(customCallbacks, customContext);
    const mock: MockEvent = createMockEvent();

    // prevent default not called on mousedown
    mouseDown(customWrapper, origin, primaryButton, mock);
    expect(mock.preventDefault).not.toHaveBeenCalled();

    // a normal lift will not occur
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
  });

  describe('cancelled before moved enough', () => {
    describe('cancelled with any keydown', () => {
      Object.keys(keyCodes).forEach((key: string) => {
        describe(`with the ${key} key`, () => {
          it('should not execute any callbacks', () => {
            mouseDown(wrapper, origin, primaryButton);
            // not moved enough yet
            windowMouseMove({ x: 0, y: sloppyClickThreshold - 1 });

            dispatchWindowKeyDownEvent(keyCodes[key]);

            // should normally start a drag
            windowMouseMove({ x: 0, y: sloppyClickThreshold });

            // should normally end a drag
            windowMouseUp();

            expect(
              callbacksCalled(callbacks)({
                onLift: 0,
                onCancel: 0,
                onDrop: 0,
              }),
            ).toBe(true);
          });

          it('should not prevent any input events', () => {
            const mouseDownMock: MockEvent = createMockEvent();
            mouseDown(wrapper, origin, auxiliaryButton, mouseDownMock);
            // not moved enough yet
            const preMouseMove: MouseEvent = windowMouseMove({
              x: 0,
              y: sloppyClickThreshold - 1,
            });
            // cancelling
            const keyDown: KeyboardEvent = dispatchWindowKeyDownEvent(
              keyCodes[key],
            );

            // should normally start a drag
            const postMouseMove: MouseEvent = windowMouseMove({
              x: 0,
              y: sloppyClickThreshold,
            });

            // should normally end a drag
            const postMouseUp: MouseEvent = windowMouseUp();

            expect(mouseDownMock.preventDefault).not.toHaveBeenCalled();
            expect(preMouseMove.defaultPrevented).toBe(false);
            expect(keyDown.defaultPrevented).toBe(false);
            expect(postMouseMove.defaultPrevented).toBe(false);
            expect(postMouseUp.defaultPrevented).toBe(false);
          });

          it('should not prevent subsequent click actions if a pending drag is cancelled', () => {
            mouseDown(wrapper, origin, auxiliaryButton);
            // not moved enough yet
            windowMouseMove({ x: 0, y: sloppyClickThreshold - 1 });
            dispatchWindowKeyDownEvent(keyCodes[key]);

            // should normally start a drag
            windowMouseMove({ x: 0, y: sloppyClickThreshold });

            // should normally end a drag
            windowMouseUp();

            const mock = jest.fn();

            mouseClick(wrapper, origin, primaryButton, {
              preventDefault: mock,
            });

            expect(mock).not.toHaveBeenCalled();
          });
        });
      });
    });

    describe('cancelled with a window resize', () => {
      let resizeEvent: Event;
      beforeEach(() => {
        mouseDown(wrapper, origin);
        // not moved enough yet
        windowMouseMove({ x: 0, y: sloppyClickThreshold - 1 });

        // trigger resize
        resizeEvent = new Event('resize');
        window.dispatchEvent(resizeEvent);

        // should normally start a drag
        windowMouseMove({ x: 0, y: sloppyClickThreshold });

        // should normally end a drag
        windowMouseUp();
      });

      it('should not call execute any callbacks', () => {
        expect(
          callbacksCalled(callbacks)({
            onLift: 0,
            onCancel: 0,
            onDrop: 0,
          }),
        ).toBe(true);
      });

      it('should not block the default action', () => {
        expect(resizeEvent.defaultPrevented).toBe(false);
      });

      it('should not prevent subsequent click actions if a pending drag is cancelled', () => {
        const mock = jest.fn();

        mouseClick(wrapper, origin, primaryButton, {
          preventDefault: mock,
        });

        expect(mock).not.toHaveBeenCalled();
      });
    });
  });
});

describe('progress', () => {
  it('should fire the onMove callback when there is drag movement', () => {
    const expected: Position = {
      x: 0,
      y: sloppyClickThreshold + 1,
    };

    mouseDown(wrapper);
    // will start the drag
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    // will fire the first move
    windowMouseMove(expected);
    requestAnimationFrame.step();

    expect(callbacks.onMove).toHaveBeenCalledWith(expected);
  });

  it('should prevent the default behaviour of a mousemove', () => {
    mouseDown(wrapper);
    const before: MouseEvent = windowMouseMove({
      x: 0,
      y: sloppyClickThreshold - 1,
    });
    // will start the drag
    const start: MouseEvent = windowMouseMove({
      x: 0,
      y: sloppyClickThreshold,
    });
    const beforeFirstFrame: MouseEvent = windowMouseMove({
      x: 0,
      y: sloppyClickThreshold + 1,
    });
    requestAnimationFrame.step();
    const afterFirstFrame: MouseEvent = windowMouseMove({
      x: 0,
      y: sloppyClickThreshold + 2,
    });

    expect(before.defaultPrevented).toBe(false);
    expect(start.defaultPrevented).toBe(true);
    expect(beforeFirstFrame.defaultPrevented).toBe(true);
    expect(afterFirstFrame.defaultPrevented).toBe(true);
  });

  it('should prevent keyboard submission', () => {
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });

    const event: KeyboardEvent = windowEnter();

    expect(event.defaultPrevented).toBe(true);
  });

  it('should prevent tabbing', () => {
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });

    const event: KeyboardEvent = windowTab();

    expect(event.defaultPrevented).toBe(true);
  });

  it('should not drop on spacebar', () => {
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });

    pressSpacebar(wrapper);

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onDrop: 0,
      }),
    ).toBe(true);
  });

  it('should not prevent scrolling on spacebar', () => {
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });

    const event: KeyboardEvent = windowSpacebar();

    expect(event.defaultPrevented).toBe(false);
  });

  it('should not attempt to move forward or backward with arrow keys', () => {
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });

    pressArrowDown(wrapper);
    pressArrowUp(wrapper);

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
      }),
    ).toBe(true);
  });

  it('should not fire a mouse movement if the mouse position has not changed since the last frame', () => {
    mouseDown(wrapper);
    // will start the drag
    windowMouseMove({ x: 0, y: sloppyClickThreshold });

    // will fire the first move
    windowMouseMove({ x: 10, y: 20 });
    requestAnimationFrame.step();
    expect(callbacks.onMove).toHaveBeenCalledWith({ x: 10, y: 20 });

    // second move event
    windowMouseMove({ x: 11, y: 21 });
    // no frame to release event
    // third move event
    windowMouseMove({ x: 10, y: 20 });
    // releasing frame
    requestAnimationFrame.step();

    expect(callbacks.onMove).toHaveBeenCalledTimes(1);
    expect(callbacks.onMove).toHaveBeenCalledWith({ x: 10, y: 20 });

    // being super safe and flushing the animation queue
    requestAnimationFrame.flush();
    expect(callbacks.onMove).toHaveBeenCalledTimes(1);
  });

  it('should collapse multiple mouse movements into a single animation frame', () => {
    // lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });

    // movements - all in a single frame
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 2 });
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 3 });
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 4 });

    // release the frame
    requestAnimationFrame.step();

    // should only be calling onMove with the last value
    expect(callbacks.onMove).toHaveBeenCalledWith({
      x: 0,
      y: sloppyClickThreshold + 4,
    });
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onMove: 1,
      }),
    ).toBe(true);
  });

  it('should not fire a move if no longer dragging when the scheduled animation frame is fired', () => {
    // lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });

    // One movement
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });

    // No frame released

    // end drag
    windowMouseUp();

    // release the frame that would otherwise have created a move
    requestAnimationFrame.step();

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        // no movements should be recorded
        onMove: 0,
        onDrop: 1,
      }),
    ).toBe(true);
  });
});

describe('window scroll during drag', () => {
  const originalScroll: Position = getWindowScroll();

  beforeEach(() => {
    setWindowScroll(origin, { shouldPublish: false });
  });

  afterEach(() => {
    setWindowScroll(originalScroll, { shouldPublish: false });
  });

  it('should not trigger onWindowScroll before an animation frame', () => {
    // lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });

    // first scroll
    setWindowScroll({
      x: 0,
      y: 0,
    });
    // second scroll
    setWindowScroll({
      x: 100,
      y: 200,
    });

    // no animation frame to release diff
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onWindowScroll: 0,
      }),
    ).toBe(true);

    // releasing a frame
    requestAnimationFrame.step();
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onWindowScroll: 1,
      }),
    ).toBe(true);
  });

  it('should only trigger onWindowScroll if still dragging when the animation frame fires', () => {
    // lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });

    // first scroll to get initial scroll
    setWindowScroll({
      x: 0,
      y: 0,
    });
    // second scroll occurring in same frame
    setWindowScroll({
      x: 100,
      y: 200,
    });

    // drop
    windowMouseUp();

    // flush window event
    requestAnimationFrame.flush();

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onDrop: 1,
        onWindowScroll: 0,
      }),
    ).toBe(true);
  });

  it('should not fire an onWindowScroll if it is not the window scrolling (ie11 bug)', () => {
    // start the lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    expect(callbacks.onLift).toHaveBeenCalled();

    // trigger scroll event
    const scrollable: HTMLElement = document.createElement('div');
    const fakeEvent: Event = new Event('scroll');
    Object.defineProperties(fakeEvent, {
      currentTarget: {
        writable: true,
        value: scrollable,
      },
    });
    window.dispatchEvent(fakeEvent);
    // ensuring any events would be published
    requestAnimationFrame.flush();

    expect(callbacks.onWindowScroll).not.toHaveBeenCalled();
  });
});

describe('finish', () => {
  it('should fire an onDrop when the drag finishes', () => {
    // lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    // drop
    windowMouseUp();

    expect(callbacks.onDrop).toHaveBeenCalled();
  });

  it('should prevent the default action on the mouseup', () => {
    // lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    // drop
    const event: MouseEvent = windowMouseUp();

    expect(event.defaultPrevented).toBe(true);
    expect(callbacks.onDrop).toHaveBeenCalled();
  });

  it('should stop listening to window mouse events after a drop', () => {
    // lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    // move
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    requestAnimationFrame.step();

    // drop
    windowMouseUp();

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onMove: 1,
        onDrop: 1,
      }),
    ).toBe(true);

    // this should have no impact
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
    windowMouseUp();
    windowMouseUp();
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 2 });
    requestAnimationFrame.flush();

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onMove: 1,
        onDrop: 1,
      }),
    ).toBe(true);
  });

  it('should fire an onDrop even when not dropping with the primary mouse button', () => {
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    const event: MouseEvent = windowMouseUp(origin, auxiliaryButton);

    expect(callbacks.onDrop).toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('should not execute any pending movements after the drop', () => {
    // lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
      }),
    ).toBe(true);

    // mouse move
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
    // movement not fired yet
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onMove: 0,
      }),
    ).toBe(true);

    // drop
    windowMouseUp();
    expect(
      callbacksCalled(callbacks)({
        // movement has not occurred yet
        onMove: 0,
        onLift: 1,
        onDrop: 1,
      }),
    ).toBe(true);

    // flush any pending animation frames
    requestAnimationFrame.flush();

    expect(
      callbacksCalled(callbacks)({
        // movement has not occurred after flush
        onMove: 0,
        onLift: 1,
        onDrop: 1,
      }),
    ).toBe(true);
  });
});

describe('cancel', () => {
  it('should cancel an existing drag by pressing Escape', () => {
    // start dragging
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 0,
      }),
    ).toBe(true);

    windowEscape();
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
  });

  it('should prevent the default Escape action', () => {
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });

    const event: KeyboardEvent = windowEscape();

    expect(event.defaultPrevented).toEqual(true);
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
  });

  it('should stop listening to mouse events after a cancel', () => {
    // lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    // move
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
    requestAnimationFrame.step();
    // cancel
    const cancelEscape: KeyboardEvent = windowEscape();

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onMove: 1,
        onCancel: 1,
      }),
    ).toBe(true);
    expect(cancelEscape.defaultPrevented).toBe(true);

    // these should not do anything
    const postMove: MouseEvent = windowMouseMove({
      x: 0,
      y: sloppyClickThreshold + 1,
    });
    const postEscape: KeyboardEvent = windowEscape();
    // no callbacks called
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onMove: 1,
        onCancel: 1,
      }),
    ).toBe(true);
    // no events prevented
    expect(postMove.defaultPrevented).toBe(false);
    expect(postEscape.defaultPrevented).toBe(false);
  });

  it('should cancel when the window is resized', () => {
    // lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    // resize event
    const event: Event = new Event('resize');
    window.dispatchEvent(event);

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onMove: 0,
        onCancel: 1,
      }),
    ).toBe(true);
    // This is not a direct cancel so we do not prevent the default action
    expect(event.defaultPrevented).toBe(false);
  });

  it('should not execute any pending movements after the cancel', () => {
    // lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
      }),
    ).toBe(true);

    // mouse move
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
    // movement not fired yet
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onMove: 0,
      }),
    ).toBe(true);

    // cancel the drag
    windowEscape();
    expect(
      callbacksCalled(callbacks)({
        // movement has not occurred yet
        onMove: 0,
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);

    // flush any pending animation frames
    requestAnimationFrame.flush();

    expect(
      callbacksCalled(callbacks)({
        // movement has not occurred after flush
        onMove: 0,
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
  });

  it('should preventprevented a click after a cancel', () => {
    // start
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });

    // cancel
    windowEscape();

    // validation
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);

    // a small amount of time has passed
    jest.runTimersToTime(10);

    // mouse is still down (not preventing mouse moves)
    const move: MouseEvent = windowMouseMove();
    expect(move.defaultPrevented).toBe(false);
    // mouse is going up (not preventing mouse up)
    const up: MouseEvent = windowMouseUp();
    expect(up.defaultPrevented).toBe(false);
    // click is firering (preventing click!)
    const click: MouseEvent = windowMouseClick();
    expect(click.defaultPrevented).toBe(true);
  });

  it('should not do anything if there is nothing dragging', () => {
    const event: KeyboardEvent = windowEscape();

    expect(whereAnyCallbacksCalled(callbacks)).toBe(false);
    expect(event.defaultPrevented).toBe(false);
  });
});

describe('post drag click prevention', () => {
  it('should prevent clicks after a successful drag', () => {
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    windowMouseUp({ x: 0, y: sloppyClickThreshold });
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onDrop: 1,
      }),
    ).toBe(true);

    // post drag click
    expect(isAWindowClickPrevented()).toBe(true);
  });

  it('should prevent clicks after a drag was cancelled', () => {
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    windowEscape();
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);

    expect(isAWindowClickPrevented()).toBe(true);
  });

  it('should not prevent a click if the sloppy click threshold was not exceeded', () => {
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold - 1 });
    windowMouseUp({ x: 0, y: sloppyClickThreshold - 1 });
    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
        onCancel: 0,
        onDrop: 0,
      }),
    ).toBe(true);

    expect(isAWindowClickPrevented()).toBe(false);
  });

  describe('subsequent interactions', () => {
    it('should allow subsequent clicks through after preventing one after a drag', () => {
      mouseDown(wrapper);
      windowMouseMove({ x: 0, y: sloppyClickThreshold });
      windowMouseUp({ x: 0, y: sloppyClickThreshold });
      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 1,
        }),
      ).toBe(true);

      // first click is prevented
      expect(isAWindowClickPrevented()).toBe(true);
      // second click is not prevented
      expect(isAWindowClickPrevented()).toBe(false);
    });
  });
});

describe('disabled mid drag', () => {
  it('should cancel a pending drag', () => {
    // lift
    mouseDown(wrapper);

    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);

    wrapper.setProps({ isEnabled: false });

    // would normally be enough to start a drag
    windowMouseMove({ x: 0, y: sloppyClickThreshold });

    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
        onCancel: 0,
      }),
    ).toBe(true);
  });

  it('should cancel any pending window scroll movements', () => {
    // lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    wrapper.setProps({ isDragging: true });

    expect(callbacksCalled(callbacks)({ onLift: 1 })).toBe(true);

    // scroll is queued
    dispatchWindowEvent('scroll');
    expect(callbacks.onWindowScroll).not.toHaveBeenCalled();

    // disable drag handle
    wrapper.setProps({ isEnabled: false });

    // flushing the animation would normally trigger a window scroll movement
    requestAnimationFrame.flush();
    expect(callbacks.onWindowScroll).not.toHaveBeenCalled();
    expect(callbacks.onCancel).toHaveBeenCalled();
  });

  it('should cancel an existing drag', () => {
    // lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    wrapper.setProps({ isDragging: true });
    // move
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
    requestAnimationFrame.step();

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onMove: 1,
        onCancel: 0,
      }),
    ).toBe(true);

    wrapper.setProps({ isEnabled: false });
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onMove: 1,
        onCancel: 1,
      }),
    ).toBe(true);
  });

  it('should stop listening to mouse events', () => {
    // lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
    wrapper.setProps({ isDragging: true });
    // move
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
    requestAnimationFrame.step();

    wrapper.setProps({ isEnabled: false });
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onMove: 1,
        onCancel: 1,
      }),
    ).toBe(true);

    // should have no impact
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
    requestAnimationFrame.step();
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 2 });
    requestAnimationFrame.step();
    windowMouseUp();
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 2 });
    requestAnimationFrame.step();

    // being super safe
    requestAnimationFrame.flush();

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onMove: 1,
        onCancel: 1,
      }),
    ).toBe(true);
  });
});

describe('cancelled elsewhere in the app mid drag', () => {
  it('should not abort a drag if a render occurs during a pending drag', () => {
    // lift
    mouseDown(wrapper);
    forceUpdate(wrapper);

    windowMouseMove({ x: 0, y: sloppyClickThreshold });

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onMove: 0,
        onCancel: 0,
      }),
    ).toBe(true);
  });

  it('should end a current drag without firing the onCancel callback', () => {
    // lift
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
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
        onMove: 0,
        onCancel: 0,
      }),
    ).toBe(true);

    // should have no impact
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
    requestAnimationFrame.step();
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 2 });
    requestAnimationFrame.step();
    windowMouseUp();
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 2 });
    requestAnimationFrame.step();

    // being super safe
    requestAnimationFrame.flush();

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onMove: 0,
        onCancel: 0,
      }),
    ).toBe(true);
  });
});

describe('unmounted mid drag', () => {
  beforeEach(() => {
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    wrapper.setProps({ isDragging: true });
    wrapper.unmount();
  });

  it('should call the onCancel prop', () => {
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
  });

  it('should unbind any window events', () => {
    windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
  });
});

describe('subsequent drags', () => {
  it('should be possible to do another drag after one finishes', () => {
    Array.from({ length: 10 }, (v, k) => k).forEach((val: number) => {
      // move memoization cache is not cleared between drags so adding 'val'.
      // it is a little edge case so not going to code around it

      const originalY: number = sloppyClickThreshold + val;

      // lift
      mouseDown(wrapper);
      windowMouseMove({ x: 0, y: originalY });
      // move
      windowMouseMove({ x: 0, y: originalY + 1 });
      requestAnimationFrame.step();
      // drop
      windowMouseUp({ x: 0, y: originalY + 1 });

      // expect(callbacks.onLift).toHaveBeenCalledTimes(val + 1);
      expect(callbacks.onMove).toHaveBeenCalledTimes(val + 1);
      // expect(callbacks.onDrop).toHaveBeenCalledTimes(val + 1);

      expect(
        callbacksCalled(callbacks)({
          onLift: val + 1,
          onMove: val + 1,
          onDrop: val + 1,
        }),
      ).toBe(true);
    });
  });

  it('should allow drags after a cancel', () => {
    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    windowEscape();

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);

    mouseDown(wrapper);
    windowMouseMove({ x: 0, y: sloppyClickThreshold });
    windowMouseUp({ x: 0, y: sloppyClickThreshold });

    expect(
      callbacksCalled(callbacks)({
        onCancel: 1,
        onLift: 2,
        onDrop: 1,
      }),
    ).toBe(true);
  });
});

describe('webkit force press', () => {
  const mouseForcePressThreshold = 2;
  const standardForce = 1;

  // $ExpectError - non-standard MouseEvent property
  const original = MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN;

  const setForceDownThreshold = (value?: number) => {
    // $ExpectError - non-standard MouseEvent property
    MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN = value;
  };

  const windowMouseForceChange = (value?: number) => {
    dispatchWindowMouseEvent('webkitmouseforcechanged', origin, primaryButton, {
      webkitForce: value,
    });
  };

  beforeEach(() => {
    setForceDownThreshold(original);
  });

  afterAll(() => {
    setForceDownThreshold(original);
  });

  it('should log a warning if a mouse force changed event is fired when there is no force value', () => {
    setForceDownThreshold(mouseForcePressThreshold);

    mouseDown(wrapper);
    // not providing any force value
    windowMouseForceChange();

    expect(console.warn).toHaveBeenCalled();
  });

  it('should log a warning if a mouse force changed event is fired when there is no MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN global', () => {
    // not setting force threshold
    setForceDownThreshold();

    mouseDown(wrapper);
    windowMouseForceChange(standardForce);

    expect(console.warn).toHaveBeenCalled();
  });

  describe('non error scenarios', () => {
    beforeEach(() => {
      setForceDownThreshold(mouseForcePressThreshold);
    });

    it('should not cancel a pending drag if the press is not a force press', () => {
      // start the pending mouse drag
      mouseDown(wrapper);

      // not a force push
      windowMouseForceChange(mouseForcePressThreshold - 0.1);

      // should start a drag
      windowMouseMove({ x: 0, y: sloppyClickThreshold });

      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
        }),
      ).toBe(true);
    });

    it('should cancel a pending drag if a force press is registered', () => {
      // start the pending mouse drag
      mouseDown(wrapper);

      // is a force push
      windowMouseForceChange(mouseForcePressThreshold);

      // would normally start a drag
      windowMouseMove({ x: 0, y: sloppyClickThreshold });

      expect(
        callbacksCalled(callbacks)({
          onLift: 0,
        }),
      ).toBe(true);
    });

    it('should not cancel a drag if the press is not a force press', () => {
      // start the drag
      mouseDown(wrapper);
      windowMouseMove({ x: 0, y: sloppyClickThreshold });

      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 0,
        }),
      ).toBe(true);

      // should not do anything
      windowMouseForceChange(mouseForcePressThreshold - 0.1);

      // a move event
      windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
      requestAnimationFrame.step();

      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 1,
        }),
      ).toBe(true);
    });

    it('should cancel a drag if a force press is registered', () => {
      // start the drag
      mouseDown(wrapper);
      windowMouseMove({ x: 0, y: sloppyClickThreshold });

      // will cancel the drag
      windowMouseForceChange(mouseForcePressThreshold);

      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        }),
      ).toBe(true);

      // movements should not do anything

      windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
      requestAnimationFrame.step();

      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        }),
      ).toBe(true);
    });

    it('should not cancel a drag if force press is not being respected', () => {
      // arrange
      const shouldRespectForceTouch: boolean = false;
      const customWrapper = getWrapper(
        callbacks,
        undefined,
        shouldRespectForceTouch,
      );

      // start the drag
      mouseDown(customWrapper);
      windowMouseMove({ x: 0, y: sloppyClickThreshold });

      // will not cancel the drag
      windowMouseForceChange(mouseForcePressThreshold);

      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
          // no cancel called
          onCancel: 0,
        }),
      ).toBe(true);
    });
  });
});
