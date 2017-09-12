// @flow
import React, { Component } from 'react';
import { mount } from 'enzyme';
// eslint-disable-next-line no-duplicate-imports
import type { ReactWrapper } from 'enzyme';
import DragHandle, { sloppyClickThreshold } from '../../../src/view/drag-handle/drag-handle';
// eslint-disable-next-line no-duplicate-imports
import type { Callbacks, Provided } from '../../../src/view/drag-handle/drag-handle-types';
import { dispatchWindowMouseEvent, dispatchWindowKeyDownEvent, mouseEvent, withKeyboard } from '../../utils/user-input-util';
import type { Position } from '../../../src/types';
import * as keyCodes from '../../../src/view/key-codes';
import getWindowScrollPosition from '../../../src/view/get-window-scroll-position';
import setWindowScroll from '../../utils/set-window-scroll';

const primaryButton: number = 0;
const auxiliaryButton: number = 1;

const getStubCallbacks = (): Callbacks => ({
  onLift: jest.fn(),
  onKeyLift: jest.fn(),
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
  onKeyLift?: number,
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
  onKeyLift = 0,
  onMove = 0,
  onMoveForward = 0,
  onMoveBackward = 0,
  onCrossAxisMoveForward = 0,
  onCrossAxisMoveBackward = 0,
  onDrop = 0,
  onCancel = 0,
}: CallBacksCalledFn = {}) =>
  callbacks.onLift.mock.calls.length === onLift &&
  callbacks.onKeyLift.mock.calls.length === onKeyLift &&
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

const windowMouseUp = dispatchWindowMouseEvent.bind(null, 'mouseup');
const windowMouseMove = dispatchWindowMouseEvent.bind(null, 'mousemove');
const mouseDown = mouseEvent.bind(null, 'mousedown');
const click = mouseEvent.bind(null, 'click');
const pressSpacebar = withKeyboard(keyCodes.space);
const windowSpacebar = dispatchWindowKeyDownEvent.bind(null, keyCodes.space);
const windowEscape = dispatchWindowKeyDownEvent.bind(null, keyCodes.escape);
const windowArrowUp = dispatchWindowKeyDownEvent.bind(null, keyCodes.arrowUp);
const windowArrowDown = dispatchWindowKeyDownEvent.bind(null, keyCodes.arrowDown);
const windowArrowLeft = dispatchWindowKeyDownEvent.bind(null, keyCodes.arrowLeft);
const windowArrowRight = dispatchWindowKeyDownEvent.bind(null, keyCodes.arrowRight);
const windowTab = dispatchWindowKeyDownEvent.bind(null, keyCodes.tab);
const windowEnter = dispatchWindowKeyDownEvent.bind(null, keyCodes.enter);

describe('drag handle', () => {
  let callbacks: Callbacks;
  let wrapper: ReactWrapper;

  beforeAll(() => {
    requestAnimationFrame.reset();
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
            >
              {(dragHandleProps: Provided) => (
                <Child dragHandleProps={dragHandleProps} />
              )}
            </DragHandle>,
          );

          mouseDown(customWrapper, 0, 0);
          windowMouseMove(point.x, point.y);

          expect(customCallbacks.onLift).toHaveBeenCalledWith(point);

          customWrapper.unmount();
        });
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

        windowSpacebar(wrapper);

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 0,
        })).toBe(true);
      });

      it('should prevent scrolling on spacebar', () => {
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);

        const event: KeyboardEvent = windowSpacebar();

        expect(event.defaultPrevented).toBe(true);
      });

      it('should not attempt to move forward or backward with arrow keys', () => {
        mouseDown(wrapper);
        windowMouseMove(0, sloppyClickThreshold);

        windowArrowDown();
        windowArrowUp();

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
      const forcePressThreshold = 2;
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
        setForceDownThreshold(forcePressThreshold);

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
          setForceDownThreshold(forcePressThreshold);
          jest.useFakeTimers();
        });

        afterEach(() => {
          jest.useRealTimers();
        });

        it('should not cancel a pending drag if the press is not a force press', () => {
          // start the pending mouse drag
          mouseDown(wrapper);

          // not a force push
          windowMouseForceChange(forcePressThreshold - 0.1);

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
          windowMouseForceChange(forcePressThreshold);

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
          windowMouseForceChange(forcePressThreshold - 0.1);

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
          windowMouseForceChange(forcePressThreshold);

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
      it('should lift when a user presses the space bar', () => {
        pressSpacebar(wrapper);

        expect(callbacksCalled(callbacks)({
          onKeyLift: 1,
        })).toBe(true);
      });

      it('should stop the event before it can be listened to', () => {
        const preventDefault = jest.fn();
        const stopPropagation = jest.fn();

        pressSpacebar(wrapper, { preventDefault, stopPropagation });

        expect(preventDefault).toHaveBeenCalled();
        expect(stopPropagation).toHaveBeenCalled();
      });

      it('should not lift if told it cannot lift', () => {
        wrapper.setProps({
          canLift: false,
        });

        pressSpacebar(wrapper);

        expect(callbacksCalled(callbacks)({
          onKeyLift: 0,
        })).toBe(true);
      });
    });

    describe('progress', () => {
      it('should prevent tabbing away from the element while dragging', () => {
        pressSpacebar(wrapper);

        const event: KeyboardEvent = windowTab();

        expect(event.defaultPrevented).toBe(true);
      });

      it('should prevent submitting the dragging item', () => {
        pressSpacebar(wrapper);
        const event: KeyboardEvent = windowEnter();

        expect(event.defaultPrevented).toBe(true);
      });

      it('should not take into account any mouse movements', () => {
        pressSpacebar(wrapper);

        windowMouseMove();

        expect(callbacksCalled(callbacks)({
          onKeyLift: 1,
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
          >
            {(dragHandleProps: Provided) => (
              <Child dragHandleProps={dragHandleProps} />
            )}
          </DragHandle>,
        );

        pressSpacebar(customWrapper);

        expect(callbacksCalled(customCallbacks)({
          onKeyLift: 1,
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
          >
            {(dragHandleProps: Provided) => (
              <Child dragHandleProps={dragHandleProps} />
            )}
          </DragHandle>,
        );

        // lift - all good
        pressSpacebar(customWrapper);

        // boom.
        windowArrowDown();

        expect(console.error).toHaveBeenCalled();
        expect(callbacksCalled(customCallbacks)({
          onKeyLift: 1,
          onCancel: 1,
          onMoveForward: 0,
        })).toBe(true);
      });

      describe('dragging in a vertical list', () => {
        it('should move backward when the user presses ArrowUp', () => {
          pressSpacebar(wrapper);
          // move backward
          windowArrowUp();
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onKeyLift: 1,
            onMoveBackward: 1,
          })).toBe(true);
        });

        it('should move forward when the user presses ArrowDown', () => {
          pressSpacebar(wrapper);
          // move forward
          windowArrowDown();
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onKeyLift: 1,
            onMoveForward: 1,
          })).toBe(true);
        });

        it('should request to move to a droppable on the left when the user presses LeftArrow', () => {
          pressSpacebar(wrapper);
          windowArrowLeft();
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onKeyLift: 1,
            onCrossAxisMoveBackward: 1,
          })).toBe(true);
        });

        it('should request to move to a droppable on the right when the user presses RightArrow', () => {
          pressSpacebar(wrapper);
          windowArrowRight();
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onKeyLift: 1,
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
          windowArrowLeft();
          requestAnimationFrame.step();

          expect(callbacksCalled(customCallbacks)({
            onKeyLift: 1,
            onMoveBackward: 1,
          })).toBe(true);
        });

        it('should move forward when the user presses RightArrow', () => {
          pressSpacebar(customWrapper);
          windowArrowRight();
          requestAnimationFrame.step();

          expect(callbacksCalled(customCallbacks)({
            onKeyLift: 1,
            onMoveForward: 1,
          })).toBe(true);
        });

        it('should request a backward cross axis move when the user presses ArrowUp', () => {
          pressSpacebar(customWrapper);
          windowArrowUp();
          requestAnimationFrame.step();

          expect(callbacksCalled(customCallbacks)({
            onKeyLift: 1,
            onCrossAxisMoveBackward: 1,
          })).toBe(true);
        });

        it('should request a forward cross axis move when the user presses ArrowDown', () => {
          pressSpacebar(customWrapper);
          windowArrowDown();
          requestAnimationFrame.step();

          expect(callbacksCalled(customCallbacks)({
            onKeyLift: 1,
            onCrossAxisMoveForward: 1,
          })).toBe(true);
        });
      });

      describe('event collapsing', () => {
        it('should collapse multiple forward movements into a single animation frame', () => {
          pressSpacebar(wrapper);

          windowArrowDown();
          windowArrowDown();
          windowArrowDown();
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onKeyLift: 1,
            onMove: 0,
            onMoveForward: 1,
            onMoveBackward: 0,
          })).toBe(true);

          // being super safe and ensuring nothing firers later
          requestAnimationFrame.flush();

          expect(callbacksCalled(callbacks)({
            onKeyLift: 1,
            onMove: 0,
            onMoveForward: 1,
            onMoveBackward: 0,
          })).toBe(true);
        });

        it('should collapse multiple backward movements into a single animation frame', () => {
          pressSpacebar(wrapper);

          windowArrowUp();
          windowArrowUp();
          windowArrowUp();
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onKeyLift: 1,
            onMove: 0,
            onMoveForward: 0,
            onMoveBackward: 1,
          })).toBe(true);

          // being super safe and ensuring nothing firers later
          requestAnimationFrame.flush();

          expect(callbacksCalled(callbacks)({
            onKeyLift: 1,
            onMove: 0,
            onMoveForward: 0,
            onMoveBackward: 1,
          })).toBe(true);
        });

        it('should not fire a scheduled forward movement if no longer dragging', () => {
          pressSpacebar(wrapper);
          windowArrowDown();
          // finishing drag before animation frame
          windowSpacebar();

          // flushing any animation frames
          requestAnimationFrame.flush();

          expect(callbacksCalled(callbacks)({
            onMoveForward: 0,
            onKeyLift: 1,
            onDrop: 1,
          })).toBe(true);
        });

        it('should not fire a scheduled backward movement if no longer dragging', () => {
          pressSpacebar(wrapper);
          windowArrowUp();
          // finishing drag before animation frame
          windowSpacebar();

          // flushing any animation frames
          requestAnimationFrame.flush();

          expect(callbacksCalled(callbacks)({
            onMoveBackward: 0,
            onKeyLift: 1,
            onDrop: 1,
          })).toBe(true);
        });
      });
    });

    describe('finish', () => {
      it('should drop when the user presses spacebar', () => {
        pressSpacebar(wrapper);
        windowSpacebar();

        expect(callbacksCalled(callbacks)({
          onKeyLift: 1,
          onDrop: 1,
        })).toBe(true);
      });
    });

    describe('cancel', () => {
      it('should cancel the drag when the user presses escape', () => {
        pressSpacebar(wrapper);
        windowEscape();

        expect(callbacksCalled(callbacks)({
          onKeyLift: 1,
          onCancel: 1,
        })).toBe(true);
      });

      it('should cancel when the user pushes any mouse button', () => {
        const mouseButtons: number[] = [primaryButton, auxiliaryButton];

        mouseButtons.forEach((button: number, index: number): void => {
          pressSpacebar(wrapper);
          mouseDown(wrapper, 0, 0, button);
          // should now do nothing
          windowArrowUp(wrapper);

          expect(callbacksCalled(callbacks)({
            onKeyLift: index + 1,
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
          onKeyLift: 1,
          onCancel: 1,
        })).toBe(true);
      });

      it('should cancel if the window is scrolled', () => {
        // lift
        pressSpacebar(wrapper);
        // scroll event
        window.dispatchEvent(new Event('scroll'));

        expect(callbacksCalled(callbacks)({
          onKeyLift: 1,
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
        const mock = jest.fn();
        pressSpacebar(wrapper);
        windowArrowDown(wrapper);
        windowSpacebar();

        click(wrapper, 0, 0, primaryButton, { preventDefault: mock });

        expect(mock).not.toHaveBeenCalled();
      });
    });

    describe('disabled mid drag', () => {
      it('should cancel the current drag', () => {
        pressSpacebar(wrapper);

        wrapper.setProps({
          isEnabled: false,
        });

        expect(callbacksCalled(callbacks)({
          onKeyLift: 1,
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
          onKeyLift: 1,
          onCancel: 0,
        })).toBe(true);

        // should have no impact
        windowArrowDown();
        requestAnimationFrame.step();
        windowArrowUp();
        requestAnimationFrame.step();
        windowEscape();
        requestAnimationFrame.step();

        // being super safe
        requestAnimationFrame.flush();

        expect(callbacksCalled(callbacks)({
          onKeyLift: 1,
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
          onKeyLift: 1,
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
          windowArrowDown(wrapper);
          requestAnimationFrame.step();
          // drop
          windowSpacebar();

          expect(callbacksCalled(callbacks)({
            onKeyLift: val + 1,
            onMoveForward: val + 1,
            onDrop: val + 1,
          })).toBe(true);
        });
      });

      it('should allow drags after a cancel', () => {
        // cancelled drag
        pressSpacebar(wrapper);
        windowEscape();

        expect(callbacksCalled(callbacks)({
          onKeyLift: 1,
          onCancel: 1,
        })).toBe(true);

        // lift and drop
        pressSpacebar(wrapper);
        windowSpacebar(wrapper);

        expect(callbacksCalled(callbacks)({
          onCancel: 1,
          onKeyLift: 2,
          onDrop: 1,
        })).toBe(true);
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
