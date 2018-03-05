// @flow
import React, { Component } from 'react';
import { mount } from 'enzyme';
// eslint-disable-next-line no-duplicate-imports
import type { ReactWrapper } from 'enzyme';
import DragHandle from '../../../src/view/drag-handle/drag-handle';
import { sloppyClickThreshold } from '../../../src/view/drag-handle/util/is-sloppy-click-threshold-exceeded';
// eslint-disable-next-line no-duplicate-imports
import type { Callbacks, DragHandleProps } from '../../../src/view/drag-handle/drag-handle-types';
import {
  dispatchWindowMouseEvent,
  dispatchWindowKeyDownEvent,
  dispatchWindowTouchEvent,
  mouseEvent,
  touchEvent,
  withKeyboard,
  dispatchWindowEvent,
} from '../../utils/user-input-util';
import type { Position, DraggableId } from '../../../src/types';
import * as keyCodes from '../../../src/view/key-codes';
import getWindowScroll from '../../../src/window/get-window-scroll';
import setWindowScroll from '../../utils/set-window-scroll';
import getArea from '../../../src/state/get-area';
import { timeForLongPress, forcePressThreshold } from '../../../src/view/drag-handle/sensor/create-touch-sensor';
import { interactiveTagNames } from '../../../src/view/drag-handle/util/should-allow-dragging-from-target';
import type { TagNameMap } from '../../../src/view/drag-handle/util/should-allow-dragging-from-target';
import { styleContextKey, canLiftContextKey } from '../../../src/view/context-keys';

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
  // $ExpectError - hacking things big time
  Object.keys(callbacks).reduce((previous: Object, key: string) => ({
    ...previous,
    [key]: callbacks[key].mock.calls.length,
  }), {});

class Child extends Component<{ dragHandleProps: ?DragHandleProps}> {
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
const windowMouseClick = dispatchWindowMouseEvent.bind(null, 'click');
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
const draggableId: DraggableId = 'draggable';

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

const isAWindowClickBlocked = (): boolean => {
  jest.spyOn(Event.prototype, 'preventDefault');
  jest.spyOn(Event.prototype, 'stopPropagation');

  const event: Event = windowMouseClick();

  const result: boolean =
    event.preventDefault.mock.calls.length === 1 &&
    event.stopPropagation.mock.calls.length === 1;

  Event.prototype.preventDefault.mockRestore();
  Event.prototype.stopPropagation.mockRestore();

  return result;
};

describe('drag handle', () => {
  let callbacks: Callbacks;
  let wrapper: ReactWrapper;

  const fakeDraggableRef: HTMLElement = document.createElement('div');
  const fakeCenter: Position = {
    x: 50,
    y: 80,
  };

  const basicContext = {
    [styleContextKey]: 'hello',
    [canLiftContextKey]: () => true,
  };

  beforeAll(() => {
    requestAnimationFrame.reset();
    jest.useFakeTimers();
    jest.spyOn(fakeDraggableRef, 'getBoundingClientRect').mockImplementation(() => getArea({
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
        draggableId={draggableId}
        callbacks={callbacks}
        direction="vertical"
        isDragging={false}
        isEnabled
        getDraggableRef={() => fakeDraggableRef}
        canDragInteractiveElements={false}
      >
        {(dragHandleProps: ?DragHandleProps) => (
          <Child dragHandleProps={dragHandleProps} />
        )}
      </DragHandle>,
      { context: basicContext }
    );
  });

  afterEach(() => {
    wrapper.unmount();
    console.error.mockRestore();

    // we need to run all timers rather than clear them as the
    // post drag click blocking needs to be cleared
    jest.runAllTimers();
  });

  afterAll(() => {
    requestAnimationFrame.reset();
    fakeDraggableRef.getBoundingClientRect.mockRestore();
  });

  it('should apply the style context to a data-attribute', () => {
    const myMock = jest.fn();
    myMock.mockReturnValue(<div>hello world</div>);

    mount(
      <DragHandle
        draggableId={draggableId}
        callbacks={callbacks}
        isEnabled
        isDragging={false}
        direction={null}
        getDraggableRef={() => fakeDraggableRef}
        canDragInteractiveElements={false}
      >
        {(dragHandleProps: ?DragHandleProps) => (
          myMock(dragHandleProps)
        )}
      </DragHandle>,
      { context: basicContext }
    );

    // $ExpectError - using lots of accessors
    expect(myMock.mock.calls[0][0]['data-react-beautiful-dnd-drag-handle']).toEqual(basicContext[styleContextKey]);
  });

  it('should apply a default aria roledescription containing lift instructions', () => {
    const myMock = jest.fn();
    myMock.mockReturnValue(<div>hello world</div>);

    mount(
      <DragHandle
        draggableId={draggableId}
        callbacks={callbacks}
        isEnabled
        isDragging={false}
        direction={null}
        getDraggableRef={() => fakeDraggableRef}
        canDragInteractiveElements={false}
      >
        {(dragHandleProps: ?DragHandleProps) => (
          myMock(dragHandleProps)
        )}
      </DragHandle>,
      { context: basicContext }
    );

    // $ExpectError - using lots of accessors
    expect(myMock.mock.calls[0][0]['aria-roledescription'])
      .toBe('Draggable item. Press space bar to lift');
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
              draggableId={draggableId}
              callbacks={customCallbacks}
              isDragging={false}
              isEnabled
              direction={null}
              getDraggableRef={() => fakeDraggableRef}
              canDragInteractiveElements={false}
            >
              {(dragHandleProps: ?DragHandleProps) => (
                <Child dragHandleProps={dragHandleProps} />
              )}
            </DragHandle>,
            { context: basicContext }
          );

          mouseDown(customWrapper, origin);
          windowMouseMove(point);

          expect(customCallbacks.onLift)
            .toHaveBeenCalledWith({ client: point, autoScrollMode: 'FLUID' });

          customWrapper.unmount();
        });
      });

      it('should stop the initial mousedown event', () => {
        const mockEvent: MockEvent = createMockEvent();

        mouseDown(wrapper, origin, primaryButton, mockEvent);

        expect(wasEventStopped(mockEvent)).toBe(true);
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

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
      });

      it('should not start a drag if another sensor is capturing', () => {
        // will now be capturing
        touchStart(wrapper);

        // lift
        mouseDown(wrapper);
        windowMouseMove({ x: 0, y: sloppyClickThreshold });

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
      });

      describe('cancelled before moved enough', () => {
        describe('cancelled with escape', () => {
          beforeEach(() => {
            mouseDown(wrapper, origin, auxiliaryButton);
            // not moved enough yet
            windowMouseMove({ x: 0, y: sloppyClickThreshold - 1 });
            windowEscape();

            // should normally start a drag
            windowMouseMove({ x: 0, y: sloppyClickThreshold });

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

            click(wrapper, origin, primaryButton, { preventDefault: mock });

            expect(mock).not.toHaveBeenCalled();
          });
        });

        describe('cancelled with a window resize', () => {
          beforeEach(() => {
            mouseDown(wrapper, origin);
            // not moved enough yet
            windowMouseMove({ x: 0, y: sloppyClickThreshold - 1 });

            // trigger resize
            window.dispatchEvent(new Event('resize'));

            // should normally start a drag
            windowMouseMove({ x: 0, y: sloppyClickThreshold });

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

            click(wrapper, origin, primaryButton, { preventDefault: mock });

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

        expect(callbacks.onMove).toBeCalledWith(expected);
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

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 0,
        })).toBe(true);
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

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMoveForward: 0,
          onMoveBackward: 0,
        })).toBe(true);
      });

      it('should not fire a mouse movement if the mouse position has not changed since the last frame', () => {
        mouseDown(wrapper);
        // will start the drag
        windowMouseMove({ x: 0, y: sloppyClickThreshold });

        // will fire the first move
        windowMouseMove({ x: 10, y: 20 });
        requestAnimationFrame.step();
        expect(callbacks.onMove).toBeCalledWith({ x: 10, y: 20 });

        // second move event
        windowMouseMove({ x: 11, y: 21 });
        // no frame to release event
        // third move event
        windowMouseMove({ x: 10, y: 20 });
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
        windowMouseMove({ x: 0, y: sloppyClickThreshold });

        // movements - all in a single frame
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 2 });
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 3 });
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 4 });

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
        windowMouseMove({ x: 0, y: sloppyClickThreshold });

        // One movement
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });

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

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onWindowScroll: 0,
        })).toBe(true);
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
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
        // drop
        windowMouseUp();

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

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 1,
          onDrop: 1,
        })).toBe(true);

        // this should have no impact
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
        windowMouseUp();
        windowMouseUp();
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 2 });
        requestAnimationFrame.flush();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 1,
          onDrop: 1,
        })).toBe(true);
      });

      it('should fire an onDrop even when not dropping with the primary mouse button', () => {
        mouseDown(wrapper);
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
        windowMouseUp(origin, auxiliaryButton);

        expect(callbacks.onDrop).toHaveBeenCalled();
      });

      it('should not execute any pending movements after the drop', () => {
        // lift
        mouseDown(wrapper);
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
        expect(callbacksCalled(callbacks)({
          onLift: 1,
        })).toBe(true);

        // mouse move
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
        // movement not fired yet
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 0,
        })).toBe(true);

        // drop
        windowMouseUp();
        expect(callbacksCalled(callbacks)({
          // movement has not occurred yet
          onMove: 0,
          onLift: 1,
          onDrop: 1,
        })).toBe(true);

        // flush any pending animation frames
        requestAnimationFrame.flush();

        expect(callbacksCalled(callbacks)({
          // movement has not occurred after flush
          onMove: 0,
          onLift: 1,
          onDrop: 1,
        })).toBe(true);
      });
    });

    describe('cancel', () => {
      it('should cancel an existing drag by pressing Escape', () => {
        // start dragging
        mouseDown(wrapper);
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
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
        windowMouseMove({ x: 0, y: sloppyClickThreshold });

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
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
        // move
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
        requestAnimationFrame.step();
        // cancel
        windowEscape();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 1,
          onCancel: 1,
        })).toBe(true);

        // these should not do anything
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
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
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
        // resize event
        window.dispatchEvent(new Event('resize'));

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 0,
          onCancel: 1,
        })).toBe(true);
      });

      it('should not execute any pending movements after the cancel', () => {
        // lift
        mouseDown(wrapper);
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
        expect(callbacksCalled(callbacks)({
          onLift: 1,
        })).toBe(true);

        // mouse move
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
        // movement not fired yet
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 0,
        })).toBe(true);

        // cancel the drag
        windowEscape();
        expect(callbacksCalled(callbacks)({
          // movement has not occurred yet
          onMove: 0,
          onLift: 1,
          onCancel: 1,
        })).toBe(true);

        // flush any pending animation frames
        requestAnimationFrame.flush();

        expect(callbacksCalled(callbacks)({
          // movement has not occurred after flush
          onMove: 0,
          onLift: 1,
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
        mouseDown(wrapper);
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
        windowMouseUp({ x: 0, y: sloppyClickThreshold });
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 1,
        })).toBe(true);

        // post drag click
        expect(isAWindowClickBlocked()).toBe(true);
      });

      it('should prevent clicks after a drag was cancelled', () => {
        mouseDown(wrapper);
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
        windowEscape();
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);

        expect(isAWindowClickBlocked()).toBe(true);
      });

      it('should not prevent a click if the sloppy click threshold was not exceeded', () => {
        mouseDown(wrapper);
        windowMouseMove({ x: 0, y: sloppyClickThreshold - 1 });
        windowMouseUp({ x: 0, y: sloppyClickThreshold - 1 });
        expect(callbacksCalled(callbacks)({
          onLift: 0,
          onCancel: 0,
          onDrop: 0,
        })).toBe(true);

        expect(isAWindowClickBlocked()).toBe(false);
      });

      describe('timeout management', () => {
        // This is to guard against the case where a click does not
        // actually fire on the element after a drag. We do not
        // want to block other clicks
        it('should not block a click after a timeout', () => {
          mouseDown(wrapper);
          windowMouseMove({ x: 0, y: sloppyClickThreshold });
          windowEscape();
          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onCancel: 1,
          })).toBe(true);

          // a single tick
          jest.runTimersToTime(1);

          expect(isAWindowClickBlocked()).toBe(false);
        });

        it('should not interfer with a new click', () => {
          mouseDown(wrapper);
          windowMouseMove({ x: 0, y: sloppyClickThreshold });
          windowEscape();
          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onCancel: 1,
          })).toBe(true);

          // beginning a new drag
          mouseDown(wrapper);

          // a single tick
          jest.runTimersToTime(1);

          // a click should not really occur like this - but checking
          // that we are not blocking it
          expect(isAWindowClickBlocked()).toBe(false);
        });
      });

      describe('subsequent interactions', () => {
        it('should allow subsequent clicks through after blocking one after a drag', () => {
          mouseDown(wrapper);
          windowMouseMove({ x: 0, y: sloppyClickThreshold });
          windowMouseUp({ x: 0, y: sloppyClickThreshold });
          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onDrop: 1,
          })).toBe(true);

          // first click is blocked
          expect(isAWindowClickBlocked()).toBe(true);
          // second click is not blocked
          expect(isAWindowClickBlocked()).toBe(false);
        });
      });
    });

    describe('disabled mid drag', () => {
      it('should cancel a pending drag', () => {
        // lift
        mouseDown(wrapper);

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);

        wrapper.setProps({ isEnabled: false });

        // would normally be enough to start a drag
        windowMouseMove({ x: 0, y: sloppyClickThreshold });

        expect(callbacksCalled(callbacks)({
          onLift: 0,
          onCancel: 0,
        })).toBe(true);
      });

      it('should cancel an existing drag', () => {
        // lift
        mouseDown(wrapper);
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
        // move
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
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
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
        // move
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
        requestAnimationFrame.step();

        wrapper.setProps({ isEnabled: false });
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 1,
          onCancel: 1,
        })).toBe(true);

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
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
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
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
        requestAnimationFrame.step();
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 2 });
        requestAnimationFrame.step();
        windowMouseUp();
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 2 });
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
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
        wrapper.unmount();
      });

      it('should call the onCancel prop', () => {
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
      });

      it('should unbind any window events', () => {
        windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });

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
          windowMouseMove({ x: 0, y: originalY });
          // move
          windowMouseMove({ x: 0, y: originalY + 1 });
          requestAnimationFrame.step();
          // drop
          windowMouseUp({ x: 0, y: originalY + 1 });

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
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
        windowEscape();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);

        mouseDown(wrapper);
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
        windowMouseUp({ x: 0, y: sloppyClickThreshold });

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
        });

        it('should not cancel a pending drag if the press is not a force press', () => {
          // start the pending mouse drag
          mouseDown(wrapper);

          // not a force push
          windowMouseForceChange(mouseForcePressThreshold - 0.1);

          // should start a drag
          windowMouseMove({ x: 0, y: sloppyClickThreshold });

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
          windowMouseMove({ x: 0, y: sloppyClickThreshold });

          expect(callbacksCalled(callbacks)({
            onLift: 0,
          })).toBe(true);
        });

        it('should not cancel a drag if the press is not a force press', () => {
          // start the drag
          mouseDown(wrapper);
          windowMouseMove({ x: 0, y: sloppyClickThreshold });

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onMove: 0,
          })).toBe(true);

          // should not do anything
          windowMouseForceChange(mouseForcePressThreshold - 0.1);

          // a move event
          windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onMove: 1,
          })).toBe(true);
        });

        it('should cancel a drag if a force press is registered', () => {
          // start the drag
          mouseDown(wrapper);
          windowMouseMove({ x: 0, y: sloppyClickThreshold });

          // will cancel the drag
          windowMouseForceChange(mouseForcePressThreshold);

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onCancel: 1,
          })).toBe(true);

          // movements should not do anything

          windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
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
          autoScrollMode: 'JUMP',
        });
      });

      it('should stop the event before it can be listened to', () => {
        const mockEvent: MockEvent = createMockEvent();

        pressSpacebar(wrapper, mockEvent);

        expect(wasEventStopped(mockEvent)).toBe(true);
      });

      it('should not lift if another sensor is capturing', () => {
        // stealing the capture
        touchStart(wrapper);

        // would normally start a drag
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
            draggableId={draggableId}
            callbacks={customCallbacks}
            isDragging={false}
            isEnabled
            direction="vertical"
            getDraggableRef={() => fakeDraggableRef}
            canDragInteractiveElements={false}
          >
            {(dragHandleProps: ?DragHandleProps) => (
              <Child dragHandleProps={dragHandleProps} />
            )}
          </DragHandle>,
          { context: basicContext }
        );

        pressSpacebar(customWrapper);

        expect(callbacksCalled(customCallbacks)({
          onLift: 1,
        })).toBe(true);
      });

      it('should instantly fire a scroll action when the window scrolls', () => {
        // lift
        pressSpacebar(wrapper);
        // scroll event
        window.dispatchEvent(new Event('scroll'));

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onWindowScroll: 1,
        })).toBe(true);
      });

      it('should prevent using keyboard keys that modify scroll', () => {
        const keys: number[] = [
          keyCodes.pageUp,
          keyCodes.pageDown,
          keyCodes.home,
          keyCodes.end,
        ];

        // lift
        pressSpacebar(wrapper);

        keys.forEach((keyCode: number) => {
          const mockEvent: MockEvent = createMockEvent();
          const trigger = withKeyboard(keyCode);

          trigger(wrapper, mockEvent);

          expect(wasEventStopped(mockEvent)).toBe(true);
          expect(callbacks.onWindowScroll).not.toHaveBeenCalled();
        });
      });

      it('should stop dragging if the keyboard is used after a lift and a direction is not provided', () => {
        const customCallbacks = getStubCallbacks();
        const customWrapper = mount(
          <DragHandle
            draggableId={draggableId}
            callbacks={customCallbacks}
            isDragging={false}
            isEnabled
            direction={null}
            getDraggableRef={() => fakeDraggableRef}
            canDragInteractiveElements={false}
          >
            {(dragHandleProps: ?DragHandleProps) => (
              <Child dragHandleProps={dragHandleProps} />
            )}
          </DragHandle>,
          { context: basicContext }
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
              draggableId={draggableId}
              callbacks={customCallbacks}
              direction="horizontal"
              isDragging={false}
              isEnabled
              getDraggableRef={() => fakeDraggableRef}
              canDragInteractiveElements={false}
            >
              {(dragHandleProps: ?DragHandleProps) => (
                <Child dragHandleProps={dragHandleProps} />
              )}
            </DragHandle>,
            { context: basicContext }
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
          windowMouseDown(origin, button);
          // should now do nothing
          pressArrowUp(wrapper);

          expect(callbacksCalled(callbacks)({
            onLift: index + 1,
            onCancel: index + 1,
          })).toBe(true);
        });
      });

      it.skip('should cancel on a page visibility change', () => {
        // TODO
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

        click(wrapper, origin, primaryButton, mockEvent);

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
        const client: Position = {
          x: 50,
          y: 100,
        };

        touchStart(wrapper, client);
        jest.runTimersToTime(timeForLongPress);

        expect(callbacks.onLift).toHaveBeenCalledWith({
          client,
          autoScrollMode: 'FLUID',
        });
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

      it('should not call preventDefault on the initial touchstart', () => {
        const mockEvent: MockEvent = createMockEvent();

        touchStart(wrapper, origin, 0, mockEvent);

        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      });

      it('should call stopPropagation on the initial touchstart to prevent parents from starting', () => {
        const mockEvent: MockEvent = createMockEvent();

        touchStart(wrapper, origin, 0, mockEvent);

        expect(mockEvent.stopPropagation).toHaveBeenCalled();
      });
    });

    describe('drag ending before it started', () => {
      it('should not start a drag if the user releases before a long press', () => {
        touchStart(wrapper);
        // have not waited long enough
        jest.runTimersToTime(timeForLongPress - 1);

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
      });

      it('should not start a drag if the user moves their finger before a long press (movement captured on element)', () => {
        const mockEvent: MockEvent = createMockEvent();

        touchStart(wrapper);
        touchMove(wrapper, origin, 0, mockEvent);
        // would normally start a drag
        jest.runTimersToTime(timeForLongPress);

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
        // letting the movement event flow through - this enables native scrolling
        expect(wasEventStopped(mockEvent)).toBe(false);
      });

      it('should not start a drag if the user moves their finger before a long press (movement captured on window)', () => {
        touchStart(wrapper);
        const event = windowTouchMove(origin);
        // would normally start a drag
        jest.runTimersToTime(timeForLongPress);

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
        // letting the movement event flow through - this enables native scrolling
        expect(event.defaultPrevented).toBe(false);
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

      it('should not start if any keypress is made', () => {
        Object.keys(keyCodes).forEach((key: string) => {
          // start a pending drag
          touchStart(wrapper);

          // should cancel the pending drag
          dispatchWindowKeyDownEvent(keyCodes[key]);

          // would normally start a drag
          jest.runAllTimers();

          expect(callbacksCalled(callbacks)({
            onLift: 0,
          })).toBe(true);
        });
      });

      it('should start if a touchstart event is fired', () => {
        touchStart(wrapper);
        // this can be the touchstart initial event
        dispatchWindowTouchEvent('touchstart');
        // flush all timers
        jest.runAllTimers();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
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
        windowTouchEnd();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 1,
        })).toBe(true);
      });

      it('should not execute pending movements after a drop', () => {
        touchStart(wrapper);
        jest.runTimersToTime(timeForLongPress);

        // move started but frame not released
        windowTouchMove({ x: 0, y: 100 });

        // finish the drag
        windowTouchEnd();
        expect(callbacksCalled(callbacks)({
          // no movement
          onMove: 0,
          onLift: 1,
          onDrop: 1,
        })).toBe(true);

        requestAnimationFrame.flush();
        expect(callbacksCalled(callbacks)({
          // still no movement
          onMove: 0,
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

      it('should cancel a drag if any keypress is made', () => {
        // end initial drag
        end();
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 1,
        })).toBe(true);

        Object.keys(keyCodes).forEach((key: string, index: number) => {
          // start drag
          start();

          // should kill the drag
          dispatchWindowKeyDownEvent(keyCodes[key]);

          expect(callbacksCalled(callbacks)({
            // initial lift + index + 1
            onLift: index + 2,
            // index + 1
            onCancel: index + 1,
            // initial drop
            onDrop: 1,
          })).toBe(true);
        });
      });

      it('should cancel if a touchstart event is fired', () => {
        dispatchWindowTouchEvent('touchstart');

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
      });

      it('should not execute pending movements after a cancel', () => {
        touchStart(wrapper);
        jest.runTimersToTime(timeForLongPress);

        // move started but frame not released
        windowTouchMove({ x: 0, y: 100 });

        // cancel the drag
        dispatchWindowEvent('orientationchange');
        expect(callbacksCalled(callbacks)({
          // no movement
          onMove: 0,
          onLift: 1,
          onCancel: 1,
        })).toBe(true);

        requestAnimationFrame.flush();
        expect(callbacksCalled(callbacks)({
          // still no movement
          onMove: 0,
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
        start();
        end();

        expect(isAWindowClickBlocked()).toBe(true);
      });

      it('should not prevent a click if no drag has occurred', () => {
        touchStart(wrapper);
        // drag has not started yet
        expect(callbacks.onLift).not.toHaveBeenCalled();
        // drag ended
        end();
        // then a click
        expect(isAWindowClickBlocked()).toBe(false);
      });

      it('should only prevent a single click', () => {
        start();
        end();

        // first click blocked
        expect(isAWindowClickBlocked()).toBe(true);

        // second click not blocked
        expect(isAWindowClickBlocked()).toBe(false);
      });

      it('should not prevent a click after a timeout', () => {
        start();
        end();

        // a single tick
        jest.runTimersToTime(1);

        // click is not blocked now
        expect(isAWindowClickBlocked()).toBe(false);
      });

      it('should not prevent clicks on subsequent unsuccessful drags', () => {
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
        expect(isAWindowClickBlocked()).toBe(false);
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
          draggableId={draggableId}
          callbacks={callbacks}
          isEnabled={false}
          isDragging={false}
          direction={null}
          getDraggableRef={() => fakeDraggableRef}
          canDragInteractiveElements={false}
        >
          {(dragHandleProps: ?DragHandleProps) => (
            mock(dragHandleProps)
          )}
        </DragHandle>,
        { context: basicContext }
      );

      expect(mock).toHaveBeenCalledWith(null);
    });
  });

  describe('generic', () => {
    type Control = {|
      name: string,
      hasPostDragClickBlocking: boolean,
      preLift: (wrap?: ReactWrapper, options?: Object) => void,
      lift: (wrap?: ReactWrapper, options?: Object) => void,
      end: (wrap?: ReactWrapper) => void,
    |}

    const trySetIsDragging = (wrap: ReactWrapper) => {
      // lift was not successful
      if (!wrap.props().callbacks.onLift.mock.calls.length) {
        return;
      }
      // would be set during a drag
      wrap.setProps({ direction: 'vertical' });
      wrap.setProps({ isDragging: true });
    };

    const touch: Control = {
      name: 'touch',
      hasPostDragClickBlocking: true,
      preLift: (wrap?: ReactWrapper = wrapper, options?: Object = {}) =>
        touchStart(wrap, origin, 0, options),
      lift: (wrap?: ReactWrapper = wrapper) => {
        jest.runTimersToTime(timeForLongPress);
        trySetIsDragging(wrap);
      },
      end: () => {
        windowTouchEnd();
      },
    };

    const keyboard: Control = {
      name: 'keyboard',
      hasPostDragClickBlocking: false,
      // no pre lift required
      preLift: () => {},
      lift: (wrap?: ReactWrapper = wrapper, options?: Object = {}) => {
        pressSpacebar(wrap, options);
        trySetIsDragging(wrap);
      },
      end: (wrap?: ReactWrapper = wrapper) => {
        // only want to fire the event if dragging - otherwise it might start a drag
        if (wrap.props().isDragging) {
          pressSpacebar(wrap);
        }
      },
    };

    const mouse: Control = {
      name: 'mouse',
      hasPostDragClickBlocking: true,
      preLift: (wrap?: ReactWrapper = wrapper, options?: Object = {}) =>
        mouseDown(wrap, origin, primaryButton, options),
      lift: (wrap?: ReactWrapper = wrapper) => {
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
        trySetIsDragging(wrap);
      },
      end: () => {
        windowMouseUp();
      },
    };

    const controls: Control[] = [mouse, keyboard, touch];

    controls.forEach((control: Control) => {
      describe(`control: ${control.name}`, () => {
        describe('window bindings', () => {
          it('should unbind all window listeners when drag ends', () => {
            jest.spyOn(window, 'addEventListener');
            jest.spyOn(window, 'removeEventListener');

            control.preLift();
            control.lift();

            // window events bound
            expect(window.addEventListener).toHaveBeenCalled();

            // nothing unabound yet
            expect(window.removeEventListener).not.toHaveBeenCalled();

            // ending the drag
            control.end();

            // validation
            expect(window.addEventListener.mock.calls.length).toBeGreaterThan(1);
            expect(window.removeEventListener.mock.calls.length).toBeGreaterThan(1);

            if (!control.hasPostDragClickBlocking) {
              expect(window.addEventListener.mock.calls.length)
                .toBe(window.removeEventListener.mock.calls.length);
            } else {
              // we have added a post drag listener after the drag
              expect(window.addEventListener.mock.calls.length)
                .toBe(window.removeEventListener.mock.calls.length + 1);

              // single tick to flush post drag click handler
              jest.runTimersToTime(1);

              expect(window.addEventListener.mock.calls.length)
                .toBe(window.removeEventListener.mock.calls.length);
            }

            // cleanup
            window.addEventListener.mockRestore();
            window.removeEventListener.mockRestore();
          });
        });

        describe('interactive element interactions', () => {
          const mixedCase = (map: TagNameMap): string[] => [
            ...Object.keys(map).map((tagName: string) => tagName.toLowerCase()),
            ...Object.keys(map).map((tagName: string) => tagName.toUpperCase()),
          ];

          describe('interactive elements', () => {
            it('should not start a drag if the target is an interactive element', () => {
              mixedCase(interactiveTagNames).forEach((tagName: string) => {
                const element: HTMLElement = document.createElement(tagName);
                const options = {
                  target: element,
                };

                control.preLift(wrapper, options);
                control.lift(wrapper, options);

                expect(callbacksCalled(callbacks)({
                  onLift: 0,
                })).toBe(true);
              });
            });

            it('should start a drag on an interactive element if asked to by user', () => {
              // allowing dragging from interactive elements
              wrapper.setProps({ canDragInteractiveElements: true });

              mixedCase(interactiveTagNames).forEach((tagName: string, index: number) => {
                const element: HTMLElement = document.createElement(tagName);
                const options = {
                  target: element,
                };

                control.preLift(wrapper, options);
                control.lift(wrapper, options);
                control.end(wrapper);

                expect(callbacksCalled(callbacks)({
                  onLift: index + 1,
                  onDrop: index + 1,
                })).toBe(true);
              });
            });

            it('should start a drag if the target is not an interactive element', () => {
              const nonInteractiveTagNames: TagNameMap = {
                a: true,
                div: true,
                span: true,
                header: true,
              };

              // counting call count between loops
              let count: number = 0;

              [true, false].forEach((bool: boolean) => {
                // doesn't matter if this is set or not
                wrapper.setProps({ canDragInteractiveElements: bool });

                mixedCase(nonInteractiveTagNames).forEach((tagName: string) => {
                  count++;
                  const element: HTMLElement = document.createElement(tagName);
                  const options = {
                    target: element,
                  };

                  control.preLift(wrapper, options);
                  control.lift(wrapper, options);
                  control.end(wrapper);

                  expect(callbacksCalled(callbacks)({
                    onLift: count,
                    onDrop: count,
                  })).toBe(true);
                });
              });
            });
          });

          describe('interactive parents', () => {
            it('should not start a drag if the parent is an interactive element', () => {
              mixedCase(interactiveTagNames).forEach((tagName: string) => {
                const parent: HTMLElement = document.createElement(tagName);
                const child: HTMLElement = document.createElement('span');
                parent.appendChild(child);
                const options = {
                  target: child,
                };

                control.preLift(wrapper, options);
                control.lift(wrapper, options);

                expect(callbacksCalled(callbacks)({
                  onLift: 0,
                })).toBe(true);
              });
            });

            it('should start a drag on an element with an interactive parent if asked to by user', () => {
              // allowing dragging from interactive elements
              wrapper.setProps({ canDragInteractiveElements: true });

              mixedCase(interactiveTagNames).forEach((tagName: string, index: number) => {
                const parent: HTMLElement = document.createElement(tagName);
                const child: HTMLElement = document.createElement('span');
                parent.appendChild(child);
                const options = {
                  target: child,
                };

                control.preLift(wrapper, options);
                control.lift(wrapper, options);
                control.end(wrapper);

                expect(callbacksCalled(callbacks)({
                  onLift: index + 1,
                  onDrop: index + 1,
                })).toBe(true);
              });
            });

            it('should start a drag if the target has no interactive parents', () => {
              const nonInteractiveTagNames: TagNameMap = {
                a: true,
                div: true,
                span: true,
                header: true,
              };

              // counting call count between loops
              let count: number = 0;

              [true, false].forEach((bool: boolean) => {
                // doesn't matter if this is set or not
                wrapper.setProps({ canDragInteractiveElements: bool });

                mixedCase(nonInteractiveTagNames).forEach((tagName: string) => {
                  count++;
                  const parent: HTMLElement = document.createElement(tagName);
                  const child: HTMLElement = document.createElement('span');
                  parent.appendChild(child);
                  const options = {
                    target: child,
                  };

                  control.preLift(wrapper, options);
                  control.lift(wrapper, options);
                  control.end(wrapper);

                  expect(callbacksCalled(callbacks)({
                    onLift: count,
                    onDrop: count,
                  })).toBe(true);
                });
              });
            });
          });

          describe('contenteditable interactions', () => {
            describe('interactive interactions are blocked', () => {
              it('should block the drag if the drag handle is itself contenteditable', () => {
                const customCallbacks = getStubCallbacks();
                const customWrapper = mount(
                  <DragHandle
                    draggableId={draggableId}
                    callbacks={customCallbacks}
                    isDragging={false}
                    isEnabled
                    direction={null}
                    getDraggableRef={() => fakeDraggableRef}
                    canDragInteractiveElements={false}
                  >
                    {(dragHandleProps: ?DragHandleProps) => (
                      <div
                        {...dragHandleProps}
                        contentEditable
                      />
                    )}
                  </DragHandle>,
                  { context: basicContext }
                );
                const target = customWrapper.getDOMNode();
                const options = {
                  target,
                };

                control.preLift(customWrapper, options);
                control.lift(customWrapper, options);
                control.end(customWrapper);

                expect(callbacksCalled(customCallbacks)({
                  onLift: 0,
                })).toBe(true);
              });

              it('should block the drag if originated from a child contenteditable', () => {
                const customCallbacks = getStubCallbacks();
                const customWrapper = mount(
                  <DragHandle
                    draggableId={draggableId}
                    callbacks={customCallbacks}
                    isDragging={false}
                    isEnabled
                    direction={null}
                    getDraggableRef={() => fakeDraggableRef}
                    canDragInteractiveElements={false}
                  >
                    {(dragHandleProps: ?DragHandleProps) => (
                      <div {...dragHandleProps}>
                        <div
                          className="editable"
                          contentEditable
                        />
                      </div>
                    )}
                  </DragHandle>,
                  { context: basicContext }
                );
                const target = customWrapper.getDOMNode().querySelector('.editable');
                if (!target) {
                  throw new Error('could not find editable element');
                }
                const options = {
                  target,
                };

                control.preLift(customWrapper, options);
                control.lift(customWrapper, options);
                control.end(customWrapper);

                expect(whereAnyCallbacksCalled(customCallbacks)).toBe(false);
              });

              it('should block the drag if originated from a child of a child contenteditable', () => {
                const customCallbacks = getStubCallbacks();
                const customWrapper = mount(
                  <DragHandle
                    draggableId={draggableId}
                    callbacks={customCallbacks}
                    isDragging={false}
                    isEnabled
                    direction={null}
                    getDraggableRef={() => fakeDraggableRef}
                    canDragInteractiveElements={false}
                  >
                    {(dragHandleProps: ?DragHandleProps) => (
                      <div {...dragHandleProps}>
                        <div
                          className="editable"
                          contentEditable
                        >
                          <p>hello there</p>
                          <span className="target">Edit me!</span>
                        </div>
                      </div>
                    )}
                  </DragHandle>,
                  { context: basicContext }
                );
                const target = customWrapper.getDOMNode().querySelector('.target');
                if (!target) {
                  throw new Error('could not find the target');
                }
                const options = {
                  target,
                };

                control.preLift(customWrapper, options);
                control.lift(customWrapper, options);
                control.end(customWrapper);

                expect(callbacksCalled(customCallbacks)({
                  onLift: 0,
                })).toBe(true);
              });

              it('should not block if contenteditable is set to false', () => {
                const customCallbacks = getStubCallbacks();
                const customWrapper = mount(
                  <DragHandle
                    draggableId={draggableId}
                    callbacks={customCallbacks}
                    isDragging={false}
                    isEnabled
                    direction={null}
                    getDraggableRef={() => fakeDraggableRef}
                    canDragInteractiveElements={false}
                  >
                    {(dragHandleProps: ?DragHandleProps) => (
                      <div {...dragHandleProps}>
                        <div
                          className="editable"
                          contentEditable={false}
                        >
                          <p>hello there</p>
                          <span className="target">Edit me!</span>
                        </div>
                      </div>
                    )}
                  </DragHandle>,
                  { context: basicContext }
                );
                const target = customWrapper.getDOMNode().querySelector('.target');
                if (!target) {
                  throw new Error('could not find the target');
                }
                const options = {
                  target,
                };

                control.preLift(customWrapper, options);
                control.lift(customWrapper, options);
                control.end(customWrapper);

                expect(callbacksCalled(customCallbacks)({
                  onLift: 1,
                  onDrop: 1,
                })).toBe(true);
              });
            });

            describe('interactive interactions are not blocked', () => {
              it('should not block the drag if the drag handle is contenteditable', () => {
                const customCallbacks = getStubCallbacks();
                const customWrapper = mount(
                  <DragHandle
                    draggableId={draggableId}
                    callbacks={customCallbacks}
                    isDragging={false}
                    isEnabled
                    direction={null}
                    getDraggableRef={() => fakeDraggableRef}
                    // stating that we can drag
                    canDragInteractiveElements
                  >
                    {(dragHandleProps: ?DragHandleProps) => (
                      <div {...dragHandleProps}>
                        <div
                          className="editable"
                          contentEditable
                        />
                      </div>
                    )}
                  </DragHandle>,
                  { context: basicContext }
                );
                const target = customWrapper.getDOMNode().querySelector('.editable');
                if (!target) {
                  throw new Error('could not find editable element');
                }
                const options = {
                  target,
                };

                control.preLift(customWrapper, options);
                control.lift(customWrapper, options);
                control.end(customWrapper);

                expect(callbacksCalled(customCallbacks)({
                  onLift: 1,
                  onDrop: 1,
                })).toBe(true);
              });

              it('should not block the drag if originated from a child contenteditable', () => {
                const customCallbacks = getStubCallbacks();
                const customWrapper = mount(
                  <DragHandle
                    draggableId={draggableId}
                    callbacks={customCallbacks}
                    isDragging={false}
                    isEnabled
                    direction={null}
                    getDraggableRef={() => fakeDraggableRef}
                    // stating that we can drag
                    canDragInteractiveElements
                  >
                    {(dragHandleProps: ?DragHandleProps) => (
                      <div {...dragHandleProps}>
                        <div
                          className="editable"
                          contentEditable
                        >
                          <p>hello there</p>
                          <span className="target">Edit me!</span>
                        </div>
                      </div>
                    )}
                  </DragHandle>,
                  { context: basicContext }
                );
                const target = customWrapper.getDOMNode().querySelector('.target');
                if (!target) {
                  throw new Error('could not find the target');
                }
                const options = {
                  target,
                };

                control.preLift(customWrapper, options);
                control.lift(customWrapper, options);
                control.end(customWrapper);

                expect(callbacksCalled(customCallbacks)({
                  onLift: 1,
                  onDrop: 1,
                })).toBe(true);
              });
            });
          });
        });

        describe('something else already dragging', () => {
          it('should not start a drag if something else is already dragging in the system', () => {
            // faking a 'false' response
            const canLift = jest.fn().mockImplementation(() => false);
            const customContext = {
              ...basicContext,
              [canLiftContextKey]: canLift,
            };
            const customCallbacks = getStubCallbacks();
            const customWrapper = mount(
              <DragHandle
                draggableId={draggableId}
                callbacks={customCallbacks}
                isDragging={false}
                isEnabled
                direction={null}
                getDraggableRef={() => fakeDraggableRef}
                canDragInteractiveElements={false}
              >
                {(dragHandleProps: ?DragHandleProps) => (
                  <Child dragHandleProps={dragHandleProps} />
                )}
              </DragHandle>,
              { context: customContext }
            );

            control.preLift(customWrapper);
            control.lift(customWrapper);
            control.end(customWrapper);

            expect(callbacksCalled(customCallbacks)({
              onLift: 0,
            })).toBe(true);
            expect(canLift).toHaveBeenCalledWith(draggableId);
          });
        });
      });
    });
  });
});
