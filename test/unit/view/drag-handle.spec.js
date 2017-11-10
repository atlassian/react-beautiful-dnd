// @flow
import React, { Component } from 'react';
import { mount } from 'enzyme';
// eslint-disable-next-line no-duplicate-imports
import type { ReactWrapper } from 'enzyme';
import DragHandle from '../../../src/view/drag-handle/drag-handle';
import { sloppyClickThreshold } from '../../../src/view/drag-handle/util/is-sloppy-click-threshold-exceeded';
// eslint-disable-next-line no-duplicate-imports
import type { Callbacks, Provided } from '../../../src/view/drag-handle/drag-handle-types';
import {
  dispatchWindowMouseEvent,
  dispatchWindowKeyDownEvent,
  dispatchWindowTouchEvent,
  mouseEvent,
  touchEvent,
  withKeyboard,
  dispatchWindowEvent,
} from '../../utils/user-input-util';
import type { Position } from '../../../src/types';
import * as keyCodes from '../../../src/view/key-codes';
import getWindowScrollPosition from '../../../src/view/get-window-scroll-position';
import setWindowScroll from '../../utils/set-window-scroll';
import getClientRect from '../../../src/state/get-client-rect';
import { timeForLongPress, forcePressThreshold } from '../../../src/view/drag-handle/sensor/create-touch-sensor';

const primaryButton: number = 0;
const auxiliaryButton: number = 1;

const getStubCallbacks = (): Callbacks => ({
  onLift: jest.fn(),
  onMove: jest.fn(),
  onMoveForward: jest.fn(),
  onMoveBackward: jest.fn(),
  onCrossAxisMoveForward: jest.fn(),
  onCrossAxisMoveBackward: jest.fn(),
  onDrop: jest.fn(),
  onCancel: jest.fn(),
  onWindowScroll: jest.fn(),
});

type CallBacksCalledFn = {|
  onLift?: number,
  onMove?: number,
  onMoveForward?: number,
  onMoveBackward?: number,
  onCrossAxisMoveForward ?: number,
  onCrossAxisMoveBackward?: number,
  onDrop?: number,
  onCancel ?: number,
  onWindowScroll ?: number,
|}

const callbacksCalled = (callbacks: Callbacks) => ({
  onLift = 0,
  onMove = 0,
  onMoveForward = 0,
  onMoveBackward = 0,
  onCrossAxisMoveForward = 0,
  onCrossAxisMoveBackward = 0,
  onDrop = 0,
  onCancel = 0,
}: CallBacksCalledFn = {}) =>
  callbacks.onLift.mock.calls.length === onLift &&
  callbacks.onMove.mock.calls.length === onMove &&
  callbacks.onMoveForward.mock.calls.length === onMoveForward &&
  callbacks.onMoveBackward.mock.calls.length === onMoveBackward &&
  callbacks.onDrop.mock.calls.length === onDrop &&
  callbacks.onCancel.mock.calls.length === onCancel &&
  callbacks.onCrossAxisMoveForward.mock.calls.length === onCrossAxisMoveForward &&
  callbacks.onCrossAxisMoveBackward.mock.calls.length === onCrossAxisMoveBackward;

const whereAnyCallbacksCalled = (callbacks: Callbacks) =>
  !callbacksCalled(callbacks)();

// useful debug function
// eslint-disable-next-line no-unused-vars
const getCallbackCalls = (callbacks: Callbacks) =>
  Object.keys(callbacks).reduce((previous: Object, key: string) => ({
    ...previous,
    [key]: callbacks[key].mock.calls.length,
  }), {});

class Child extends Component {
  props: {
    dragHandleProps?: Provided,
  }
  render() {
    return (
      <div {...this.props.dragHandleProps}>
        Drag me!
      </div>
    );
  }
}

// mouse events
const windowMouseUp = dispatchWindowMouseEvent.bind(null, 'mouseup');
const windowMouseDown = dispatchWindowMouseEvent.bind(null, 'mousedown');
const windowMouseMove = dispatchWindowMouseEvent.bind(null, 'mousemove');
const mouseDown = mouseEvent.bind(null, 'mousedown');
const click = mouseEvent.bind(null, 'click');
// keyboard events
const pressSpacebar = withKeyboard(keyCodes.space);
const windowSpacebar = dispatchWindowKeyDownEvent.bind(null, keyCodes.space);
const pressArrowDown = withKeyboard(keyCodes.arrowDown);
const pressArrowUp = withKeyboard(keyCodes.arrowUp);
const pressArrowRight = withKeyboard(keyCodes.arrowRight);
const pressArrowLeft = withKeyboard(keyCodes.arrowLeft);
const pressEscape = withKeyboard(keyCodes.escape);
const windowEscape = dispatchWindowKeyDownEvent.bind(null, keyCodes.escape);
const pressTab = withKeyboard(keyCodes.tab);
const windowTab = dispatchWindowKeyDownEvent.bind(null, keyCodes.tab);
const pressEnter = withKeyboard(keyCodes.enter);
const windowEnter = dispatchWindowKeyDownEvent.bind(null, keyCodes.enter);
// touch events
const touchStart = touchEvent.bind(null, 'touchstart');
const touchMove = touchEvent.bind(null, 'touchmove');
const windowTouchMove = dispatchWindowTouchEvent.bind(null, 'touchmove');
const windowTouchEnd = dispatchWindowTouchEvent.bind(null, 'touchend');
const windowTouchCancel = dispatchWindowTouchEvent.bind(null, 'touchcancel');

const origin: Position = { x: 0, y: 0 };

type MockEvent = {|
  preventDefault: Function,
  stopPropagation: Function,
|}

const createMockEvent = (): MockEvent => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
});

const wasEventStopped = (mockEvent: MockEvent): boolean =>
  Boolean(
    mockEvent.preventDefault.mock.calls.length &&
    mockEvent.stopPropagation.mock.calls.length
  );

describe('drag handle', () => {
  let callbacks: Callbacks;
  let wrapper: ReactWrapper;

  const fakeDraggableRef: HTMLElement = document.createElement('div');
  const fakeCenter: Position = {
    x: 50,
    y: 80,
  };

  beforeAll(() => {
    requestAnimationFrame.reset();
    jest.spyOn(fakeDraggableRef, 'getBoundingClientRect').mockImplementation(() => getClientRect({
      left: 0,
      top: 0,
      right: fakeCenter.x * 2,
      bottom: fakeCenter.y * 2,
    }));
  });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
    callbacks = getStubCallbacks();
    wrapper = mount(
      <DragHandle
        callbacks={callbacks}
        direction="vertical"
        isDragging={false}
        isEnabled
        canLift
        getDraggableRef={() => fakeDraggableRef}
      >
        {(dragHandleProps: Provided) => (
          <Child dragHandleProps={dragHandleProps} />
        )}
      </DragHandle>,
    );
  });

  afterEach(() => {
    wrapper.unmount();
    console.error.mockRestore();
  });

  afterAll(() => {
    requestAnimationFrame.reset();
    fakeDraggableRef.getBoundingClientRect.mockRestore();
  });

  describe('mouse dragging', () => {
    describe('initiation', () => {
      it('should start a drag if there was sufficient mouse movement in any direction', () => {
        const valid: Position[] = [
          { x: 0, y: sloppyClickThreshold },
          { x: 0, y: -sloppyClickThreshold },
          { x: sloppyClickThreshold, y: 0 },
          { x: -sloppyClickThreshold, y: 0 },
        ];

        valid.forEach((point: Position): void => {
          const customCallbacks = getStubCallbacks();
          const customWrapper = mount(
            <DragHandle
              callbacks={customCallbacks}
              isDragging={false}
              isEnabled
              canLift
              getDraggableRef={() => fakeDraggableRef}
            >
              {(dragHandleProps: Provided) => (
                <Child dragHandleProps={dragHandleProps} />
              )}
            </DragHandle>,
          );

          mouseDown(customWrapper, 0, 0);
          windowMouseMove(point.x, point.y);

          expect(customCallbacks.onLift)
            .toHaveBeenCalledWith({ client: point, isScrollAllowed: true });

          customWrapper.unmount();
        });
      });

      it('should stop the initial mousedown event', () => {
        const mockEvent: MockEvent = createMockEvent();

        mouseDown(wrapper, 0, 0, primaryButton, mockEvent);

        expect(wasEventStopped(mockEvent)).toBe(true);
      });

      it('should not start a drag if there was no mouse movement while mouse was pressed', () => {
        mouseDown(wrapper);
        windowMouseUp();

        expect(whereAnyCallbacksCalled(callbacks)).toBe(false);
      });

      it('should not start a drag if there was too little mouse movement while mouse was pressed', () => {
        mouseDown(wrapper, 0, 0);
        windowMouseMove(0, sloppyClickThreshold - 1);
        windowMouseUp(0, sloppyClickThreshold - 1);

        expect(whereAnyCallbacksCalled(callbacks)).toBe(false);
      });

      it('should not start a drag if not using the primary mouse button', () => {
        mouseDown(wrapper, 0, 0, auxiliaryButton);
        windowMouseMove(0, sloppyClickThreshold);

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
      });

      it('should not start a drag if cannot lift', () => {
        wrapper.setProps({
          canLift: false,
        });

        // lift
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
      });

      describe('cancelled before moved enough', () => {
        describe('cancelled with escape', () => {
          beforeEach(() => {
            mouseDown(wrapper, 0, 0, auxiliaryButton);
            // not moved enough yet
            windowMouseMove(0, sloppyClickThreshold - 1);
            windowEscape();

            // should normally start a drag
            windowMouseMove(0, sloppyClickThreshold);

            // should normally end a drag
            windowMouseUp();
          });

          it('should not call execute any callbacks', () => {
            expect(callbacksCalled(callbacks)({
              onLift: 0,
              onCancel: 0,
              onDrop: 0,
            })).toBe(true);
          });

          it('should not prevent subsequent click actions if a pending drag is cancelled', () => {
            const mock = jest.fn();

            click(wrapper, 0, 0, primaryButton, { preventDefault: mock });

            expect(mock).not.toHaveBeenCalled();
          });
        });

        describe('cancelled with a window resize', () => {
          beforeEach(() => {
            mouseDown(wrapper, 0, 0);
            // not moved enough yet
            windowMouseMove(0, sloppyClickThreshold - 1);

            // trigger resize
            window.dispatchEvent(new Event('resize'));

            // should normally start a drag
            windowMouseMove(0, sloppyClickThreshold);

            // should normally end a drag
            windowMouseUp();
          });

          it('should not call execute any callbacks', () => {
            expect(callbacksCalled(callbacks)({
              onLift: 0,
              onCancel: 0,
              onDrop: 0,
            })).toBe(true);
          });

          it('should not prevent subsequent click actions if a pending drag is cancelled', () => {
            const mock = jest.fn();

            click(wrapper, 0, 0, primaryButton, { preventDefault: mock });

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
        windowMouseMove(0, sloppyClickThreshold);
        // will fire the first move
        windowMouseMove(expected.x, expected.y);
        requestAnimationFrame.step();

        expect(callbacks.onMove).toBeCalledWith(expected);
      });

      it('should prevent keyboard submission', () => {
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);

        const event: KeyboardEvent = windowEnter();

        expect(event.defaultPrevented).toBe(true);
      });

      it('should prevent tabbing', () => {
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);

        const event: KeyboardEvent = windowTab();

        expect(event.defaultPrevented).toBe(true);
      });

      it('should not drop on spacebar', () => {
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);

        pressSpacebar(wrapper);

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 0,
        })).toBe(true);
      });

      it('should not prevent scrolling on spacebar', () => {
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);

        const event: KeyboardEvent = windowSpacebar();

        expect(event.defaultPrevented).toBe(false);
      });

      it('should not attempt to move forward or backward with arrow keys', () => {
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);

        pressArrowDown(wrapper);
        pressArrowUp(wrapper);

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMoveForward: 0,
          onMoveBackward: 0,
        })).toBe(true);
      });

      it('should not fire a mouse movement if the mouse position has not changed since the last frame', () => {
        mouseDown(wrapper);
        // will start the drag
        windowMouseMove(0, sloppyClickThreshold);

        // will fire the first move
        windowMouseMove(10, 20);
        requestAnimationFrame.step();
        expect(callbacks.onMove).toBeCalledWith({ x: 10, y: 20 });

        // second move event
        windowMouseMove(11, 21);
        // no frame to release event
        // third move event
        windowMouseMove(10, 20);
        // releasing frame
        requestAnimationFrame.step();

        expect(callbacks.onMove).toHaveBeenCalledTimes(1);
        expect(callbacks.onMove).toBeCalledWith({ x: 10, y: 20 });

        // being super safe and flushing the animation queue
        requestAnimationFrame.flush();
        expect(callbacks.onMove).toHaveBeenCalledTimes(1);
      });

      it('should collapse multiple mouse movements into a single animation frame', () => {
        // lift
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);

        // movements - all in a single frame
        windowMouseMove(0, sloppyClickThreshold + 1);
        windowMouseMove(0, sloppyClickThreshold + 2);
        windowMouseMove(0, sloppyClickThreshold + 3);
        windowMouseMove(0, sloppyClickThreshold + 4);

        // release the frame
        requestAnimationFrame.step();

        // should only be calling onMove with the last value
        expect(callbacks.onMove).toBeCalledWith({ x: 0, y: sloppyClickThreshold + 4 });
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 1,
        })).toBe(true);
      });

      it('should not fire a move if no longer dragging when the scheduled animation frame is fired', () => {
        // lift
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);

        // One movement
        windowMouseMove(0, sloppyClickThreshold + 1);

        // No frame released

        // end drag
        windowMouseUp();

        // release the frame that would otherwise have created a move
        requestAnimationFrame.step();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          // no movements should be recorded
          onMove: 0,
          onDrop: 1,
        })).toBe(true);
      });
    });

    describe('window scroll during drag', () => {
      const originalScroll: Position = getWindowScrollPosition();
      const origin: Position = { x: 0, y: 0 };

      beforeEach(() => {
        setWindowScroll(origin, { shouldPublish: false });
      });

      afterEach(() => {
        setWindowScroll(originalScroll, { shouldPublish: false });
      });

      it('should not trigger onWindowScroll before an animation frame', () => {
        // lift
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);

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

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onWindowScroll: 0,
        })).toBe(true);
      });

      it('should only trigger onWindowScroll if still dragging when the animation frame fires', () => {
        // lift
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);

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

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 1,
          onWindowScroll: 0,
        })).toBe(true);
      });
    });

    describe('finish', () => {
      it('should fire an onDrop when the drag finishes', () => {
        // lift
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);
        // drop
        windowMouseUp();

        expect(callbacks.onDrop).toHaveBeenCalled();
      });

      it('should stop listening to window mouse events after a drop', () => {
        // lift
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);
        // move
        windowMouseMove(0, sloppyClickThreshold);
        requestAnimationFrame.step();

        // drop
        windowMouseUp();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 1,
          onDrop: 1,
        })).toBe(true);

        // this should have no impact
        windowMouseMove(0, sloppyClickThreshold);
        windowMouseMove(0, sloppyClickThreshold + 1);
        windowMouseUp();
        windowMouseUp();
        windowMouseMove(0, sloppyClickThreshold + 2);
        requestAnimationFrame.flush();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 1,
          onDrop: 1,
        })).toBe(true);
      });

      it('should fire an onDrop even when not dropping with the primary mouse button', () => {
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);
        windowMouseUp(0, 0, auxiliaryButton);

        expect(callbacks.onDrop).toHaveBeenCalled();
      });
    });

    describe('cancel', () => {
      it('should cancel an existing drag by pressing Escape', () => {
        // start dragging
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 0,
        })).toBe(true);

        windowEscape();
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
      });

      it('should prevent the default Escape action', () => {
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);

        const event = windowEscape();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
        expect(event.defaultPrevented).toEqual(true);
      });

      it('should stop listening to mouse events after a cancel', () => {
        // lift
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);
        // move
        windowMouseMove(0, sloppyClickThreshold + 1);
        requestAnimationFrame.step();
        // cancel
        windowEscape();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 1,
          onCancel: 1,
        })).toBe(true);

        // these should not do anything
        windowMouseMove(0, sloppyClickThreshold + 1);
        windowEscape();
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 1,
          onCancel: 1,
        })).toBe(true);
      });

      it('should cancel when the window is resized', () => {
        // lift
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);
        // resize event
        window.dispatchEvent(new Event('resize'));

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 0,
          onCancel: 1,
        })).toBe(true);
      });

      it('should not do anything if there is nothing dragging', () => {
        windowEscape();
        expect(whereAnyCallbacksCalled(callbacks)).toBe(false);
      });
    });

    describe('post drag click prevention', () => {
      it('should prevent clicks after a successful drag', () => {
        const mock = jest.fn();

        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);
        windowMouseUp(0, sloppyClickThreshold);
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 1,
        })).toBe(true);

        click(wrapper, 0, 0, primaryButton, { preventDefault: mock });
        expect(mock).toHaveBeenCalled();
      });

      it('should prevent clicks after a drag was cancelled', () => {
        const mock = jest.fn();

        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);
        windowEscape();
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);

        click(wrapper, 0, 0, primaryButton, { preventDefault: mock });
        expect(mock).toHaveBeenCalled();
      });

      it('should not prevent a click if the sloppy click threshold was not exceeded', () => {
        const mock = jest.fn();

        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold - 1);
        windowMouseUp(0, sloppyClickThreshold - 1);
        expect(callbacksCalled(callbacks)({
          onLift: 0,
          onCancel: 0,
          onDrop: 0,
        })).toBe(true);

        click(wrapper, 0, 0, primaryButton, { preventDefault: mock });
        expect(mock).not.toHaveBeenCalled();
      });

      describe('subsequent interactions', () => {
        it('should allow subsequent clicks through after blocking one after a drag', () => {
          mouseDown(wrapper);
          windowMouseMove(0, sloppyClickThreshold);
          windowMouseUp(0, sloppyClickThreshold);
          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onDrop: 1,
          })).toBe(true);

          const mock1 = jest.fn();
          click(wrapper, 0, 0, primaryButton, { preventDefault: mock1 });
          expect(mock1).toHaveBeenCalled();

          const mock2 = jest.fn();
          click(wrapper, 0, 0, primaryButton, { preventDefault: mock2 });
          expect(mock2).not.toHaveBeenCalled();
        });
      });
    });

    describe('disabled mid drag', () => {
      it('should cancel a pending drag', () => {

      });

      it('should cancel an existing drag', () => {
        // lift
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);
        // move
        windowMouseMove(0, sloppyClickThreshold + 1);
        requestAnimationFrame.step();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 1,
          onCancel: 0,
        })).toBe(true);

        wrapper.setProps({ isEnabled: false });
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 1,
          onCancel: 1,
        })).toBe(true);
      });

      it('should stop listening to mouse events', () => {
        // lift
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold + 1);
        // move
        windowMouseMove(0, sloppyClickThreshold + 1);
        requestAnimationFrame.step();

        wrapper.setProps({ isEnabled: false });
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 1,
          onCancel: 1,
        })).toBe(true);

        // should have no impact
        windowMouseMove(0, sloppyClickThreshold + 1);
        requestAnimationFrame.step();
        windowMouseMove(0, sloppyClickThreshold + 2);
        requestAnimationFrame.step();
        windowMouseUp();
        windowMouseMove(0, sloppyClickThreshold + 2);
        requestAnimationFrame.step();

        // being super safe
        requestAnimationFrame.flush();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 1,
          onCancel: 1,
        })).toBe(true);
      });
    });

    describe('cancelled elsewhere in the app mid drag', () => {
      it('should end a current drag without firing the onCancel callback', () => {
        // lift
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);
        wrapper.setProps({
          isDragging: true,
        });

        // cancelled mid drag
        wrapper.setProps({
          isDragging: false,
        });

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 0,
          onCancel: 0,
        })).toBe(true);

        // should have no impact
        windowMouseMove(0, sloppyClickThreshold + 1);
        requestAnimationFrame.step();
        windowMouseMove(0, sloppyClickThreshold + 2);
        requestAnimationFrame.step();
        windowMouseUp();
        windowMouseMove(0, sloppyClickThreshold + 2);
        requestAnimationFrame.step();

        // being super safe
        requestAnimationFrame.flush();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 0,
          onCancel: 0,
        })).toBe(true);
      });
    });

    describe('unmounted mid drag', () => {
      beforeEach(() => {
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);
        wrapper.unmount();
      });

      it('should call the onCancel prop', () => {
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
      });

      it('should unbind any window events', () => {
        windowMouseMove(0, sloppyClickThreshold + 1);

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
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
          windowMouseMove(0, originalY);
          // move
          windowMouseMove(0, originalY + 1);
          requestAnimationFrame.step();
          // drop
          windowMouseUp(0, originalY + 1);

          // expect(callbacks.onLift).toHaveBeenCalledTimes(val + 1);
          expect(callbacks.onMove).toHaveBeenCalledTimes(val + 1);
          // expect(callbacks.onDrop).toHaveBeenCalledTimes(val + 1);

          expect(callbacksCalled(callbacks)({
            onLift: val + 1,
            onMove: val + 1,
            onDrop: val + 1,
          })).toBe(true);
        });
      });

      it('should allow drags after a cancel', () => {
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);
        windowEscape();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);

        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);
        windowMouseUp(wrapper, 0, sloppyClickThreshold);

        expect(callbacksCalled(callbacks)({
          onCancel: 1,
          onLift: 2,
          onDrop: 1,
        })).toBe(true);
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
        dispatchWindowMouseEvent('webkitmouseforcechanged', 0, 0, primaryButton, {
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

        expect(console.error).toHaveBeenCalled();
      });

      it('should log a warning if a mouse force changed event is fired when there is no MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN global', () => {
        // not setting force threshold
        setForceDownThreshold();

        mouseDown(wrapper);
        windowMouseForceChange(standardForce);

        expect(console.error).toHaveBeenCalled();
      });

      describe('non error scenarios', () => {
        beforeEach(() => {
          setForceDownThreshold(mouseForcePressThreshold);
          jest.useFakeTimers();
        });

        afterEach(() => {
          jest.useRealTimers();
        });

        it('should not cancel a pending drag if the press is not a force press', () => {
          // start the pending mouse drag
          mouseDown(wrapper);

          // not a force push
          windowMouseForceChange(mouseForcePressThreshold - 0.1);

          // should start a drag
          windowMouseMove(0, sloppyClickThreshold);

          expect(callbacksCalled(callbacks)({
            onLift: 1,
          })).toBe(true);
        });

        it('should cancel a pending drag if a force press is registered', () => {
          // start the pending mouse drag
          mouseDown(wrapper);

          // is a force push
          windowMouseForceChange(mouseForcePressThreshold);

          // would normally start a drag
          windowMouseMove(0, sloppyClickThreshold);

          expect(callbacksCalled(callbacks)({
            onLift: 0,
          })).toBe(true);
        });

        it('should not cancel a drag if the press is not a force press', () => {
          // start the drag
          mouseDown(wrapper);
          windowMouseMove(0, sloppyClickThreshold);

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onMove: 0,
          })).toBe(true);

          // should not do anything
          windowMouseForceChange(mouseForcePressThreshold - 0.1);

          // a move event
          windowMouseMove(0, sloppyClickThreshold + 1);
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onMove: 1,
          })).toBe(true);
        });

        it('should cancel a drag if a force press is registered', () => {
          // start the drag
          mouseDown(wrapper);
          windowMouseMove(0, sloppyClickThreshold);

          // will cancel the drag
          windowMouseForceChange(mouseForcePressThreshold);

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onCancel: 1,
          })).toBe(true);

          // movements should not do anything

          windowMouseMove(0, sloppyClickThreshold + 1);
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onCancel: 1,
          })).toBe(true);
        });
      });
    });
  });

  describe('keyboard dragging', () => {
    describe('initiation', () => {
      it('should lift when a user presses the space bar and use the center as the selection point', () => {
        pressSpacebar(wrapper);

        expect(callbacks.onLift).toHaveBeenCalledWith({
          client: fakeCenter,
          isScrollAllowed: false,
        });
      });

      it('should stop the event before it can be listened to', () => {
        const mockEvent: MockEvent = createMockEvent();

        pressSpacebar(wrapper, mockEvent);

        expect(wasEventStopped(mockEvent)).toBe(true);
      });

      it('should not lift if told it cannot lift', () => {
        wrapper.setProps({
          canLift: false,
        });

        pressSpacebar(wrapper);

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
      });

      it('should not lift if disabled', () => {
        wrapper.setProps({
          isEnabled: false,
        });

        pressSpacebar(wrapper);

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
      });
    });

    describe('progress', () => {
      it('should prevent tabbing away from the element while dragging', () => {
        const mockEvent: MockEvent = createMockEvent();

        pressSpacebar(wrapper);
        // pressing tab on the element itself as it must have focus to drag
        pressTab(wrapper, mockEvent);

        expect(wasEventStopped(mockEvent)).toBe(true);
      });

      it('should prevent submitting the dragging item', () => {
        const mockEvent: MockEvent = createMockEvent();

        pressSpacebar(wrapper);
        // pressing enter on the element itself as it must have focus to drag
        pressEnter(wrapper, mockEvent);

        expect(wasEventStopped(mockEvent)).toBe(true);
      });

      it('should not take into account any mouse movements', () => {
        pressSpacebar(wrapper);

        windowMouseMove();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 0,
          onMoveForward: 0,
          onMoveBackward: 0,
        })).toBe(true);
      });

      it('should be able to lift without a direction provided', () => {
        const customCallbacks = getStubCallbacks();
        const customWrapper = mount(
          <DragHandle
            callbacks={customCallbacks}
            isDragging={false}
            isEnabled
            canLift
            getDraggableRef={() => fakeDraggableRef}
          >
            {(dragHandleProps: Provided) => (
              <Child dragHandleProps={dragHandleProps} />
            )}
          </DragHandle>,
        );

        pressSpacebar(customWrapper);

        expect(callbacksCalled(customCallbacks)({
          onLift: 1,
        })).toBe(true);
      });

      it('should stop dragging if the keyboard is used after a lift and a direction is not provided', () => {
        const customCallbacks = getStubCallbacks();
        const customWrapper = mount(
          <DragHandle
            callbacks={customCallbacks}
            isDragging={false}
            isEnabled
            canLift
            getDraggableRef={() => fakeDraggableRef}
          >
            {(dragHandleProps: Provided) => (
              <Child dragHandleProps={dragHandleProps} />
            )}
          </DragHandle>,
        );

        // lift - all good
        pressSpacebar(customWrapper);

        // boom
        pressArrowDown(customWrapper);

        expect(console.error).toHaveBeenCalled();
        expect(callbacksCalled(customCallbacks)({
          onLift: 1,
          onCancel: 1,
          onMoveForward: 0,
        })).toBe(true);
      });

      describe('dragging in a vertical list', () => {
        it('should move backward when the user presses ArrowUp', () => {
          pressSpacebar(wrapper);
          // move backward
          pressArrowUp(wrapper);
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onMoveBackward: 1,
          })).toBe(true);
        });

        it('should move forward when the user presses ArrowDown', () => {
          pressSpacebar(wrapper);
          // move forward
          pressArrowDown(wrapper);
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onMoveForward: 1,
          })).toBe(true);
        });

        it('should request to move to a droppable on the left when the user presses LeftArrow', () => {
          pressSpacebar(wrapper);
          pressArrowLeft(wrapper);
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onCrossAxisMoveBackward: 1,
          })).toBe(true);
        });

        it('should request to move to a droppable on the right when the user presses RightArrow', () => {
          pressSpacebar(wrapper);
          pressArrowRight(wrapper);
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onCrossAxisMoveForward: 1,
          })).toBe(true);
        });
      });

      describe('dragging in a horizontal list', () => {
        let customWrapper: ReactWrapper;
        let customCallbacks: Callbacks;

        beforeEach(() => {
          customCallbacks = getStubCallbacks();
          customWrapper = mount(
            <DragHandle
              callbacks={customCallbacks}
              direction="horizontal"
              isDragging={false}
              isEnabled
              canLift
              getDraggableRef={() => fakeDraggableRef}
            >
              {(dragHandleProps: Provided) => (
                <Child dragHandleProps={dragHandleProps} />
              )}
            </DragHandle>,
          );
        });

        afterEach(() => {
          customWrapper.unmount();
        });

        it('should move backward when the user presses LeftArrow', () => {
          pressSpacebar(customWrapper);
          pressArrowLeft(customWrapper);
          requestAnimationFrame.step();

          expect(callbacksCalled(customCallbacks)({
            onLift: 1,
            onMoveBackward: 1,
          })).toBe(true);
        });

        it('should move forward when the user presses RightArrow', () => {
          pressSpacebar(customWrapper);
          pressArrowRight(customWrapper);
          requestAnimationFrame.step();

          expect(callbacksCalled(customCallbacks)({
            onLift: 1,
            onMoveForward: 1,
          })).toBe(true);
        });

        it('should request a backward cross axis move when the user presses ArrowUp', () => {
          pressSpacebar(customWrapper);
          pressArrowUp(customWrapper);
          requestAnimationFrame.step();

          expect(callbacksCalled(customCallbacks)({
            onLift: 1,
            onCrossAxisMoveBackward: 1,
          })).toBe(true);
        });

        it('should request a forward cross axis move when the user presses ArrowDown', () => {
          pressSpacebar(customWrapper);
          pressArrowDown(customWrapper);
          requestAnimationFrame.step();

          expect(callbacksCalled(customCallbacks)({
            onLift: 1,
            onCrossAxisMoveForward: 1,
          })).toBe(true);
        });
      });

      describe('event collapsing', () => {
        it('should collapse multiple forward movements into a single animation frame', () => {
          pressSpacebar(wrapper);

          pressArrowDown(wrapper);
          pressArrowDown(wrapper);
          pressArrowDown(wrapper);
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onMove: 0,
            onMoveForward: 1,
            onMoveBackward: 0,
          })).toBe(true);

          // being super safe and ensuring nothing firers later
          requestAnimationFrame.flush();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onMove: 0,
            onMoveForward: 1,
            onMoveBackward: 0,
          })).toBe(true);
        });

        it('should collapse multiple backward movements into a single animation frame', () => {
          pressSpacebar(wrapper);

          pressArrowUp(wrapper);
          pressArrowUp(wrapper);
          pressArrowUp(wrapper);
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onMove: 0,
            onMoveForward: 0,
            onMoveBackward: 1,
          })).toBe(true);

          // being super safe and ensuring nothing firers later
          requestAnimationFrame.flush();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onMove: 0,
            onMoveForward: 0,
            onMoveBackward: 1,
          })).toBe(true);
        });

        it('should not fire a scheduled forward movement if no longer dragging', () => {
          pressSpacebar(wrapper);
          pressArrowDown(wrapper);
          // finishing drag before animation frame
          pressSpacebar(wrapper);

          // flushing any animation frames
          requestAnimationFrame.flush();

          expect(callbacksCalled(callbacks)({
            onMoveForward: 0,
            onLift: 1,
            onDrop: 1,
          })).toBe(true);
        });

        it('should not fire a scheduled backward movement if no longer dragging', () => {
          pressSpacebar(wrapper);
          pressArrowUp(wrapper);
          // finishing drag before animation frame
          pressSpacebar(wrapper);

          // flushing any animation frames
          requestAnimationFrame.flush();

          expect(callbacksCalled(callbacks)({
            onMoveBackward: 0,
            onLift: 1,
            onDrop: 1,
          })).toBe(true);
        });
      });
    });

    describe('finish', () => {
      it('should drop when the user presses spacebar', () => {
        pressSpacebar(wrapper);
        pressSpacebar(wrapper);

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 1,
        })).toBe(true);
      });

      it('should stop the event before it can be listened to', () => {
        const preventDefault = jest.fn();
        const stopPropagation = jest.fn();

        pressSpacebar(wrapper);
        pressSpacebar(wrapper, { preventDefault, stopPropagation });

        expect(preventDefault).toHaveBeenCalled();
        expect(stopPropagation).toHaveBeenCalled();
      });
    });

    describe('cancel', () => {
      it('should cancel the drag when the user presses escape and stop the event', () => {
        const mockEvent: MockEvent = createMockEvent();

        pressSpacebar(wrapper);
        pressEscape(wrapper, mockEvent);

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
        expect(wasEventStopped(mockEvent)).toBe(true);
      });

      it('should cancel when the user pushes any mouse button', () => {
        const mouseButtons: number[] = [primaryButton, auxiliaryButton];

        mouseButtons.forEach((button: number, index: number): void => {
          pressSpacebar(wrapper);
          windowMouseDown(button);
          // should now do nothing
          pressArrowUp(wrapper);

          expect(callbacksCalled(callbacks)({
            onLift: index + 1,
            onCancel: index + 1,
          })).toBe(true);
        });
      });

      it('should cancel when the window is resized', () => {
        // lift
        pressSpacebar(wrapper);
        // resize event
        window.dispatchEvent(new Event('resize'));

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
      });

      it('should cancel if the window is scrolled', () => {
        // lift
        pressSpacebar(wrapper);
        // scroll event
        window.dispatchEvent(new Event('scroll'));

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
      });

      it('should not do anything if there is nothing dragging', () => {
        windowEscape();
        expect(whereAnyCallbacksCalled(callbacks)).toBe(false);
      });
    });

    describe('post drag click', () => {
      it('should not prevent any clicks after a drag', () => {
        const mockEvent: MockEvent = createMockEvent();
        pressSpacebar(wrapper);
        pressArrowDown(wrapper);
        pressSpacebar(wrapper);

        click(wrapper, 0, 0, primaryButton, mockEvent);

        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      });
    });

    describe('disabled mid drag', () => {
      it('should cancel the current drag', () => {
        pressSpacebar(wrapper);

        wrapper.setProps({
          isEnabled: false,
        });

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
      });
    });

    describe('cancelled elsewhere in the app mid drag', () => {
      it('should end a current drag without firing the onCancel callback', () => {
        // lift
        pressSpacebar(wrapper);
        wrapper.setProps({
          isDragging: true,
        });

        // cancelled mid drag
        wrapper.setProps({
          isDragging: false,
        });

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 0,
        })).toBe(true);

        // should have no impact
        pressArrowDown(wrapper);
        requestAnimationFrame.step();
        pressArrowUp(wrapper);
        requestAnimationFrame.step();
        windowEscape();
        requestAnimationFrame.step();

        // being super safe
        requestAnimationFrame.flush();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 0,
        })).toBe(true);
      });
    });

    describe('unmounted mid drag', () => {
      beforeEach(() => {
        pressSpacebar(wrapper);
        wrapper.unmount();
      });

      it('should call the onCancel prop', () => {
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
      });
    });

    describe('subsequent drags', () => {
      it('should be possible to do another drag after one finishes', () => {
        Array.from({ length: 10 }, (v, k) => k).forEach((val: number) => {
          // lift
          pressSpacebar(wrapper);
          // move forward
          pressArrowDown(wrapper);
          requestAnimationFrame.step();
          // drop
          pressSpacebar(wrapper);

          expect(callbacksCalled(callbacks)({
            onLift: val + 1,
            onMoveForward: val + 1,
            onDrop: val + 1,
          })).toBe(true);
        });
      });

      it('should allow drags after a cancel', () => {
        // cancelled drag
        pressSpacebar(wrapper);
        pressEscape(wrapper);

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);

        // lift and drop
        pressSpacebar(wrapper);
        pressSpacebar(wrapper);

        expect(callbacksCalled(callbacks)({
          onCancel: 1,
          onLift: 2,
          onDrop: 1,
        })).toBe(true);
      });
    });
  });

  describe('touch dragging', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
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
      describe('starting with long press', () => {
        it('should start a drag on long press', () => {
          const client: Position = {
            x: 50,
            y: 100,
          };

          touchStart(wrapper, client);
          jest.runTimersToTime(timeForLongPress);

          expect(callbacks.onLift).toHaveBeenCalledWith({ client, isScrollAllowed: false });
        });

        it('should not fire a second lift after movement that would have otherwise have started a drag', () => {
          touchStart(wrapper, origin);
          jest.runTimersToTime(timeForLongPress);

          expect(callbacksCalled(callbacks)({
            onLift: 1,
          })).toBe(true);

          // movement that would normally start a lift, but now will not
          windowTouchMove({ x: 0, y: sloppyClickThreshold });

          // should not have lifted again
          expect(callbacksCalled(callbacks)({
            onLift: 1,
          })).toBe(true);
        });
      });

      describe('starting with movement', () => {
        it('should start a drag if the user moves more than a threshold', () => {
          const valid: Position[] = [
            { x: 0, y: sloppyClickThreshold },
            { x: 0, y: -sloppyClickThreshold },
            { x: sloppyClickThreshold, y: 0 },
            { x: -sloppyClickThreshold, y: 0 },
          ];

          valid.forEach((point: Position): void => {
            const customCallbacks = getStubCallbacks();
            const customWrapper = mount(
              <DragHandle
                callbacks={customCallbacks}
                isDragging={false}
                isEnabled
                canLift
                getDraggableRef={() => fakeDraggableRef}
              >
                {(dragHandleProps: Provided) => (
                  <Child dragHandleProps={dragHandleProps} />
                )}
              </DragHandle>,
            );

            touchStart(customWrapper, { x: 0, y: 0 });
            windowTouchMove(point);

            expect(customCallbacks.onLift)
              .toHaveBeenCalledWith({ client: origin, isScrollAllowed: false });

            customWrapper.unmount();
          });
        });

        it('should not start a drag if the user does not move more than a threshold', () => {
          const invalid: Position[] = [
            { x: 0, y: sloppyClickThreshold - 1 },
            { x: 0, y: -sloppyClickThreshold + 1 },
            { x: sloppyClickThreshold - 1, y: 0 },
            { x: -sloppyClickThreshold + 1, y: 0 },
          ];

          invalid.forEach((point: Position): void => {
            const customCallbacks = getStubCallbacks();
            const customWrapper = mount(
              <DragHandle
                callbacks={customCallbacks}
                isDragging={false}
                isEnabled
                canLift
                getDraggableRef={() => fakeDraggableRef}
              >
                {(dragHandleProps: Provided) => (
                  <Child dragHandleProps={dragHandleProps} />
                )}
              </DragHandle>,
            );

            touchStart(customWrapper, { x: 0, y: 0 });
            windowTouchMove(point);

            expect(customCallbacks.onLift).not.toHaveBeenCalled();

            customWrapper.unmount();
          });
        });

        it('should not fire a second lift after the long press timer completes', () => {
          // starting a drag with a long press
          touchStart(wrapper, origin);
          windowTouchMove({ x: 0, y: sloppyClickThreshold });

          expect(callbacksCalled(callbacks)({
            onLift: 1,
          })).toBe(true);

          // long press timer now expires
          jest.runTimersToTime(timeForLongPress);

          // it should not trigger another lift
          expect(callbacksCalled(callbacks)({
            onLift: 1,
          })).toBe(true);
        });
      });

      it('should opt out of native scrolling (touchmove first on element)', () => {
        const mockEvent: MockEvent = createMockEvent();

        // start a drag
        touchStart(wrapper);
        jest.runTimersToTime(timeForLongPress);
        // move on the element
        touchMove(wrapper, { x: 0, y: 0 }, 0, mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
      });

      it('should opt out of native scrolling (touchmove first on window)', () => {
        // start a drag
        touchStart(wrapper);
        jest.runTimersToTime(timeForLongPress);
        // move on the window
        const event: Event = windowTouchMove();

        expect(event.defaultPrevented).toBe(true);
      });
    });

    describe('drag ending before it started', () => {
      it('should not start a drag if the user releases before a long press and there is not enough movement', () => {
        touchStart(wrapper);
        // have not waited long enough
        jest.runTimersToTime(timeForLongPress - 1);

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
      });

      it('should not start a drag if a touchend is fired', () => {
        touchStart(wrapper);
        // ended before timer finished
        windowTouchEnd();
        // flush all timers
        jest.runAllTimers();

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
      });

      it('should not start a drag if a touchcancel is fired', () => {
        touchStart(wrapper);
        // cancelled before timer finished
        windowTouchCancel();
        // flush all timers
        jest.runAllTimers();

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
      });

      it('should not start a drag after a resize', () => {
        touchStart(wrapper);
        // resize before timer finished
        dispatchWindowEvent('resize');
        // flush all timers
        jest.runAllTimers();

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
      });

      it('should not start a drag after a orientation change', () => {
        touchStart(wrapper);
        dispatchWindowEvent('orientationchange');
        // flush all timers
        jest.runAllTimers();

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
      });

      it('should not start a drag after a window scroll', () => {
        touchStart(wrapper);
        dispatchWindowEvent('scroll');
        // flush all timers
        jest.runAllTimers();

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
      });

      it('should not start a drag if unmounted', () => {
        touchStart(wrapper);
        wrapper.unmount();

        // flush all timers
        jest.runAllTimers();

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
      });
    });

    describe('progress', () => {
      it('should schedule a move to the new position', () => {
        const target: Position = { x: 100, y: 50 };

        start();
        windowTouchMove(target);

        // scheduled move has not yet occurred
        expect(callbacks.onMove).not.toHaveBeenCalled();

        // releasing the movement
        requestAnimationFrame.step();
        expect(callbacks.onMove).toHaveBeenCalledWith(target);
      });

      it('should prevent any context menu from popping', () => {
        start();

        const event: Event = dispatchWindowEvent('contextmenu');

        expect(event.defaultPrevented).toBe(true);
      });
    });

    describe('dropping', () => {
      it('should drop a drag on touchend', () => {
        touchStart(wrapper);
        jest.runTimersToTime(timeForLongPress);
        windowTouchEnd();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 1,
        })).toBe(true);
      });
    });

    describe('cancelling a drag that has started', () => {
      beforeEach(start);

      it('should cancel a drag if it is disabled mid drag', () => {
        wrapper.setProps({
          isEnabled: false,
        });

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
      });

      it('should cancel a drag if unmounted', () => {
        wrapper.unmount();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
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

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onCancel: 0,
          })).toBe(true);

          // should have no impact
          windowTouchMove({ x: 100, y: 200 });
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onCancel: 0,
          })).toBe(true);
        });
      });

      it('should cancel the drag if a touchcancel is fired', () => {
        windowTouchCancel();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
      });

      it('should cancel the drag after a resize', () => {
        dispatchWindowEvent('resize');

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
      });

      it('should cancel the drag after a orientation change', () => {
        dispatchWindowEvent('orientationchange');

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
      });

      it('should cancel the drag after a window scroll', () => {
        dispatchWindowEvent('scroll');

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
      });
    });

    describe('force press', () => {
      const forcePress = (force?: number = forcePressThreshold): void => {
        dispatchWindowEvent('touchforcechange', {
          touches: [{
            force,
          }],
        });
      };

      describe('drag not yet started', () => {
        it('should not start a drag if a force press occurs', () => {
          touchStart(wrapper);
          forcePress(forcePressThreshold);
          // would normally start a drag
          jest.runAllTimers();

          expect(callbacksCalled(callbacks)({
            onLift: 0,
          })).toBe(true);
        });

        it('should not block lifting if the force press is not strong enough', () => {
          touchStart(wrapper);
          forcePress(forcePressThreshold - 0.1);
          // would normally start a drag
          jest.runAllTimers();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
          })).toBe(true);
        });

        it('should not block lifting if the force press occurs after a window touchmove (and before a drag starts)', () => {
          touchStart(wrapper, origin);
          // firing a touch move - but not enough to start a drag
          windowTouchMove({ x: 0, y: sloppyClickThreshold - 1 });
          expect(callbacks.onLift).not.toHaveBeenCalled();

          // force press should no longer prevent the drag from starting
          forcePress();
          // start the drag with a long press
          jest.runAllTimers();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
          })).toBe(true);
        });
      });

      describe('drag started', () => {
        it('should cancel the drag if no movement has occurred yet', () => {
          start();
          forcePress();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onCancel: 1,
          })).toBe(true);
        });

        it('should not cancel the drag if movement has occurred before the force press', () => {
          start();
          windowTouchMove({ x: 10, y: 20 });
          forcePress();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onCancel: 0,
          })).toBe(true);
        });
      });
    });

    it('should allow standard tap interactions', () => {
      const mockEvent: MockEvent = createMockEvent();

      touchStart(wrapper, { x: 0, y: 0 }, 0, mockEvent);
      const endEvent: Event = windowTouchEnd();

      // flush any timers
      jest.runAllTimers();

      // initial touch start not blocked
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      // end of lift not blocked
      expect(endEvent.defaultPrevented).toBe(false);
    });

    describe('click prevention', () => {
      it('should prevent a click if a drag has occurred', () => {
        const mockEvent: MockEvent = createMockEvent();

        start();
        end();
        click(wrapper, 0, 0, primaryButton, mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
      });

      it('should not prevent a click if no drag has occurred', () => {
        const mockEvent: MockEvent = createMockEvent();

        touchStart(wrapper);
        // drag has not started yet
        expect(callbacks.onLift).not.toHaveBeenCalled();
        // drag ended
        end();
        // then a click
        click(wrapper, 0, 0, primaryButton, mockEvent);

        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      });

      it('should only prevent a single click', () => {
        const mockEvent: MockEvent = createMockEvent();

        start();
        end();

        // first click blocked
        click(wrapper, 0, 0, primaryButton, mockEvent);
        expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);

        // second click not blocked
        click(wrapper, 0, 0, primaryButton, mockEvent);
        expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
      });

      it('should not prevent clicks on subsequent unsuccessful drags', () => {
        const mockEvent: MockEvent = createMockEvent();

        // first drag
        start();
        end();
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 1,
        })).toBe(true);

        // second drag start unsuccessful
        touchStart(wrapper);
        end();
        // no lift or drop occurred
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 1,
        })).toBe(true);

        // click after unsuccessful drag is not blocked
        click(wrapper, 0, 0, primaryButton, mockEvent);
        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      });
    });

    describe('subsequent drags', () => {
      it('should be possible to do another drag after one finishes', () => {
        Array.from({ length: 10 }, (v, k) => k).forEach((val: number) => {
          start();
          // moves are memoized
          move({ x: 0, y: val });
          end();

          expect(callbacksCalled(callbacks)({
            onLift: val + 1,
            onMove: val + 1,
            onDrop: val + 1,
          })).toBe(true);
        });
      });
    });
  });

  describe('drag disabled', () => {
    it('should not pass any handleProps to the child', () => {
      const mock = jest.fn();
      mock.mockReturnValue(<div>hello world</div>);

      mount(
        <DragHandle
          callbacks={callbacks}
          isEnabled={false}
          isDragging={false}
        >
          {(dragHandleProps: ?Provided) => (
            mock(dragHandleProps)
          )}
        </DragHandle>,
      );

      expect(mock).toHaveBeenCalledWith(null);
    });
  });
});
