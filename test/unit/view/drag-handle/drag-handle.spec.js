// @flow
import React, { Component, type Node } from 'react';
import { getRect } from 'css-box-model';
import { mount, type ReactWrapper } from 'enzyme';
import DragHandle from '../../../../src/view/drag-handle/drag-handle';
import { sloppyClickThreshold } from '../../../../src/view/drag-handle/util/is-sloppy-click-threshold-exceeded';
import type { Callbacks, DragHandleProps } from '../../../../src/view/drag-handle/drag-handle-types';
import {
  dispatchWindowMouseEvent,
  dispatchWindowKeyDownEvent,
  dispatchWindowTouchEvent,
  mouseEvent,
  touchEvent,
  withKeyboard,
  dispatchWindowEvent,
} from '../../../utils/user-input-util';
import type { Position, DraggableId } from '../../../../src/types';
import * as keyCodes from '../../../../src/view/key-codes';
import getWindowScroll from '../../../../src/view/window/get-window-scroll';
import setWindowScroll from '../../../utils/set-window-scroll';
import { timeForLongPress, forcePressThreshold } from '../../../../src/view/drag-handle/sensor/create-touch-sensor';
import { interactiveTagNames } from '../../../../src/view/drag-handle/util/should-allow-dragging-from-target';
import type { TagNameMap } from '../../../../src/view/drag-handle/util/should-allow-dragging-from-target';
import { styleContextKey, canLiftContextKey } from '../../../../src/view/context-keys';
import * as attributes from '../../../../src/view/data-attributes';

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

const resetCallbacks = (callbacks: Callbacks) => {
  Object.keys(callbacks).forEach((key: string) => {
    callbacks[key].mockReset();
  });
};

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

type ChildProps = {|
  dragHandleProps: ?DragHandleProps,
  className?: string,
  children?: Node,
|}

class Child extends Component<ChildProps> {
  render() {
    return (
      <div {...this.props.dragHandleProps} className={this.props.className}>
        Drag me!
        {this.props.children}
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
const mouseClick = mouseEvent.bind(null, 'click');
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
const windowTouchStart = dispatchWindowTouchEvent.bind(null, 'touchstart');
const windowTouchMove = dispatchWindowTouchEvent.bind(null, 'touchmove');
const windowTouchEnd = dispatchWindowTouchEvent.bind(null, 'touchend');
const windowTouchCancel = dispatchWindowTouchEvent.bind(null, 'touchcancel');

const origin: Position = { x: 0, y: 0 };
const draggableId: DraggableId = 'draggable';

type MockEvent = {|
  preventDefault: Function,
|}

const createMockEvent = (): MockEvent => ({
  preventDefault: jest.fn(),
});

const isAWindowClickPrevented = (): boolean => {
  const event: Event = windowMouseClick();
  return event.defaultPrevented;
};

const basicContext = {
  [styleContextKey]: 'hello',
  [canLiftContextKey]: () => true,
};

const fakeCenter: Position = {
  x: 50,
  y: 80,
};
const parentRef: HTMLElement = document.createElement('div');
const childRef: HTMLElement = document.createElement('div');
const singleRef: HTMLElement = document.createElement('div');

[parentRef, childRef, singleRef].forEach((ref: HTMLElement) => {
  // faking that they are drag handles
  ref.setAttribute(attributes.dragHandle, 'yolo');

  jest.spyOn(ref, 'getBoundingClientRect').mockImplementation(() => getRect({
    left: 0,
    top: 0,
    right: fakeCenter.x * 2,
    bottom: fakeCenter.y * 2,
  }));
});

const getNestedWrapper = (parentCallbacks: Callbacks, childCallbacks: Callbacks): ReactWrapper =>
  mount(
    <DragHandle
      draggableId="parent"
      callbacks={parentCallbacks}
      direction="vertical"
      isDragging={false}
      isDropAnimating={false}
      isEnabled
      getDraggableRef={() => parentRef}
      canDragInteractiveElements={false}
    >
      {(parentProps: ?DragHandleProps) => (
        <Child dragHandleProps={parentProps} className="parent">
          <DragHandle
            draggableId="child"
            callbacks={childCallbacks}
            direction="vertical"
            isDragging={false}
            isDropAnimating={false}
            isEnabled
            getDraggableRef={() => childRef}
            canDragInteractiveElements={false}
          >
            {(childProps: ?DragHandleProps) => (
              <Child dragHandleProps={childProps} className="child">
                Child!
              </Child>
            )}
          </DragHandle>
        </Child>
      )}
    </DragHandle>,
    { context: basicContext }
  );

const getWrapper = (callbacks: Callbacks): ReactWrapper =>
  mount(
    <DragHandle
      draggableId={draggableId}
      callbacks={callbacks}
      direction="vertical"
      isDragging={false}
      isDropAnimating={false}
      isEnabled
      getDraggableRef={() => singleRef}
      canDragInteractiveElements={false}
    >
      {(dragHandleProps: ?DragHandleProps) => (
        <Child dragHandleProps={dragHandleProps} />
      )}
    </DragHandle>,
    { context: basicContext }
  );

describe('drag handle', () => {
  let callbacks: Callbacks;
  let wrapper: ReactWrapper;

  beforeAll(() => {
    requestAnimationFrame.reset();
    jest.useFakeTimers();
  });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
    callbacks = getStubCallbacks();
    wrapper = getWrapper(callbacks);
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
    singleRef.getBoundingClientRect.mockRestore();
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
        isDropAnimating={false}
        direction={null}
        getDraggableRef={() => singleRef}
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
        isDropAnimating={false}
        direction={null}
        getDraggableRef={() => singleRef}
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
              isDropAnimating={false}
              isEnabled
              direction={null}
              getDraggableRef={() => singleRef}
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

        const event: MouseEvent = windowMouseMove({ x: 0, y: sloppyClickThreshold - 1 });

        expect(event.defaultPrevented).toBe(false);
      });

      it('should call preventDefault on the mouse move that starts a drag', () => {
        mouseDown(wrapper);

        // not enough to start a drag
        const first: MouseEvent = windowMouseMove({ x: 0, y: sloppyClickThreshold - 1 });
        // enough movement to start a drag
        const second: MouseEvent = windowMouseMove({ x: 0, y: sloppyClickThreshold });

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

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
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

          expect(callbacksCalled(callbacks)({
            onLift: 0,
          })).toBe(true);
        });
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

                expect(callbacksCalled(callbacks)({
                  onLift: 0,
                  onCancel: 0,
                  onDrop: 0,
                })).toBe(true);
              });

              it('should not prevent any input events', () => {
                const mouseDownMock: MockEvent = createMockEvent();
                mouseDown(wrapper, origin, auxiliaryButton, mouseDownMock);
                // not moved enough yet
                const preMouseMove: MouseEvent =
                  windowMouseMove({ x: 0, y: sloppyClickThreshold - 1 });
                // cancelling
                const keyDown: KeyboardEvent = dispatchWindowKeyDownEvent(keyCodes[key]);

                // should normally start a drag
                const postMouseMove: MouseEvent =
                  windowMouseMove({ x: 0, y: sloppyClickThreshold });

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

                mouseClick(wrapper, origin, primaryButton, { preventDefault: mock });

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
            expect(callbacksCalled(callbacks)({
              onLift: 0,
              onCancel: 0,
              onDrop: 0,
            })).toBe(true);
          });

          it('should not block the default action', () => {
            expect(resizeEvent.defaultPrevented).toBe(false);
          });

          it('should not prevent subsequent click actions if a pending drag is cancelled', () => {
            const mock = jest.fn();

            mouseClick(wrapper, origin, primaryButton, { preventDefault: mock });

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

      it('should prevent the default behaviour of a mousemove', () => {
        mouseDown(wrapper);
        const before: MouseEvent = windowMouseMove({ x: 0, y: sloppyClickThreshold - 1 });
        // will start the drag
        const start: MouseEvent = windowMouseMove({ x: 0, y: sloppyClickThreshold });
        const beforeFirstFrame: MouseEvent = windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
        requestAnimationFrame.step();
        const afterFirstFrame: MouseEvent = windowMouseMove({ x: 0, y: sloppyClickThreshold + 2 });

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
        const event: MouseEvent = windowMouseUp(origin, auxiliaryButton);

        expect(callbacks.onDrop).toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(true);
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

        const event: KeyboardEvent = windowEscape();

        expect(event.defaultPrevented).toEqual(true);
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
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

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 1,
          onCancel: 1,
        })).toBe(true);
        expect(cancelEscape.defaultPrevented).toBe(true);

        // these should not do anything
        const postMove: MouseEvent = windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
        const postEscape: KeyboardEvent = windowEscape();
        // no callbacks called
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 1,
          onCancel: 1,
        })).toBe(true);
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

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 0,
          onCancel: 1,
        })).toBe(true);
        // This is not a direct cancel so we do not prevent the default action
        expect(event.defaultPrevented).toBe(false);
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

      it('should preventprevented a click after a cancel', () => {
        // start
        mouseDown(wrapper);
        windowMouseMove({ x: 0, y: sloppyClickThreshold });

        // cancel
        windowEscape();

        // validation
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);

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
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 1,
        })).toBe(true);

        // post drag click
        expect(isAWindowClickPrevented()).toBe(true);
      });

      it('should prevent clicks after a drag was cancelled', () => {
        mouseDown(wrapper);
        windowMouseMove({ x: 0, y: sloppyClickThreshold });
        windowEscape();
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);

        expect(isAWindowClickPrevented()).toBe(true);
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

        expect(isAWindowClickPrevented()).toBe(false);
      });

      describe('subsequent interactions', () => {
        it('should allow subsequent clicks through after preventing one after a drag', () => {
          mouseDown(wrapper);
          windowMouseMove({ x: 0, y: sloppyClickThreshold });
          windowMouseUp({ x: 0, y: sloppyClickThreshold });
          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onDrop: 1,
          })).toBe(true);

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
        const event: MockEvent = createMockEvent();

        pressSpacebar(wrapper, event);

        expect(callbacks.onLift).toHaveBeenCalledWith({
          client: fakeCenter,
          autoScrollMode: 'JUMP',
        });
        // default action is prevented
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should stop the event before it can be listened to', () => {
        const mockEvent: MockEvent = createMockEvent();

        pressSpacebar(wrapper, mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
      });

      it('should not lift if another sensor is capturing', () => {
        // stealing the capture
        touchStart(wrapper);

        // would normally start a drag
        const mock: MockEvent = createMockEvent();
        pressSpacebar(wrapper, mock);

        // not starting a drag
        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
        // not preventing default on the event
        expect(mock.preventDefault).not.toHaveBeenCalled();
      });

      it('should not lift if disabled', () => {
        const mock: MockEvent = createMockEvent();
        wrapper.setProps({
          isEnabled: false,
        });

        pressSpacebar(wrapper, mock);

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
        expect(mock.preventDefault).not.toHaveBeenCalled();
      });
    });

    describe('progress', () => {
      it('should prevent tabbing away from the element while dragging', () => {
        const mockEvent: MockEvent = createMockEvent();

        pressSpacebar(wrapper);
        // pressing tab on the element itself as it must have focus to drag
        pressTab(wrapper, mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
      });

      it('should prevent submitting the dragging item', () => {
        const mockEvent: MockEvent = createMockEvent();

        pressSpacebar(wrapper);
        // pressing enter on the element itself as it must have focus to drag
        pressEnter(wrapper, mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
      });

      it('should not take into account any mouse movements', () => {
        pressSpacebar(wrapper);

        const event: MouseEvent = windowMouseMove();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 0,
          onMoveForward: 0,
          onMoveBackward: 0,
        })).toBe(true);
        expect(event.defaultPrevented).toBe(false);
      });

      it('should be able to lift without a direction provided', () => {
        const customCallbacks = getStubCallbacks();
        const customWrapper = mount(
          <DragHandle
            draggableId={draggableId}
            callbacks={customCallbacks}
            isDragging={false}
            isDropAnimating={false}
            isEnabled
            direction="vertical"
            getDraggableRef={() => singleRef}
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
        const event: Event = new Event('scroll');
        window.dispatchEvent(event);

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onWindowScroll: 1,
        })).toBe(true);
        expect(event.defaultPrevented).toBe(false);
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

          expect(mockEvent.preventDefault).toHaveBeenCalled();
          expect(callbacks.onWindowScroll).not.toHaveBeenCalled();
        });
      });

      it('should stop dragging if the keyboard is used after a lift and a direction is not provided', () => {
        const customCallbacks = getStubCallbacks();
        const mockEvent: MockEvent = createMockEvent();
        const customWrapper = mount(
          <DragHandle
            draggableId={draggableId}
            callbacks={customCallbacks}
            isDragging={false}
            isDropAnimating={false}
            isEnabled
            direction={null}
            getDraggableRef={() => singleRef}
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
        pressArrowDown(customWrapper, mockEvent);

        expect(console.error).toHaveBeenCalled();
        expect(callbacksCalled(customCallbacks)({
          onLift: 1,
          onCancel: 1,
          onMoveForward: 0,
        })).toBe(true);
        expect(mockEvent.preventDefault).toHaveBeenCalled();
      });

      describe('dragging in a vertical list', () => {
        it('should move backward when the user presses ArrowUp', () => {
          const mockEvent: MockEvent = createMockEvent();

          pressSpacebar(wrapper);
          // move backward
          pressArrowUp(wrapper, mockEvent);
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onMoveBackward: 1,
          })).toBe(true);
          // we are using the event as a part of the drag
          expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it('should move forward when the user presses ArrowDown', () => {
          const mockEvent: MockEvent = createMockEvent();

          pressSpacebar(wrapper);
          // move forward
          pressArrowDown(wrapper, mockEvent);
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onMoveForward: 1,
          })).toBe(true);
          // we are using the event as a part of the drag
          expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it('should request to move to a droppable on the left when the user presses LeftArrow', () => {
          const mockEvent: MockEvent = createMockEvent();

          pressSpacebar(wrapper);
          pressArrowLeft(wrapper, mockEvent);
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onCrossAxisMoveBackward: 1,
          })).toBe(true);
          // we are using the event as a part of the drag
          expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it('should request to move to a droppable on the right when the user presses RightArrow', () => {
          const mockEvent: MockEvent = createMockEvent();

          pressSpacebar(wrapper);
          pressArrowRight(wrapper, mockEvent);
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onCrossAxisMoveForward: 1,
          })).toBe(true);
          // we are using the event as a part of the drag
          expect(mockEvent.preventDefault).toHaveBeenCalled();
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
              isDropAnimating={false}
              isEnabled
              getDraggableRef={() => singleRef}
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
          const mockEvent: MockEvent = createMockEvent();

          pressSpacebar(customWrapper);
          pressArrowLeft(customWrapper, mockEvent);
          requestAnimationFrame.step();

          expect(callbacksCalled(customCallbacks)({
            onLift: 1,
            onMoveBackward: 1,
          })).toBe(true);
          // we are using the event as a part of the drag
          expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it('should move forward when the user presses RightArrow', () => {
          const mockEvent: MockEvent = createMockEvent();

          pressSpacebar(customWrapper);
          pressArrowRight(customWrapper, mockEvent);
          requestAnimationFrame.step();

          expect(callbacksCalled(customCallbacks)({
            onLift: 1,
            onMoveForward: 1,
          })).toBe(true);
          // we are using the event as a part of the drag
          expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it('should request a backward cross axis move when the user presses ArrowUp', () => {
          const mockEvent: MockEvent = createMockEvent();

          pressSpacebar(customWrapper);
          pressArrowUp(customWrapper, mockEvent);
          requestAnimationFrame.step();

          expect(callbacksCalled(customCallbacks)({
            onLift: 1,
            onCrossAxisMoveBackward: 1,
          })).toBe(true);
          // we are using the event as a part of the drag
          expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it('should request a forward cross axis move when the user presses ArrowDown', () => {
          const mockEvent: MockEvent = createMockEvent();

          pressSpacebar(customWrapper);
          pressArrowDown(customWrapper, mockEvent);
          requestAnimationFrame.step();

          expect(callbacksCalled(customCallbacks)({
            onLift: 1,
            onCrossAxisMoveForward: 1,
          })).toBe(true);
          // we are using the event as a part of the drag
          expect(mockEvent.preventDefault).toHaveBeenCalled();
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

      it('should prevent default on the event', () => {
        const lift: MockEvent = createMockEvent();
        const drop: MockEvent = createMockEvent();

        pressSpacebar(wrapper, lift);
        pressSpacebar(wrapper, drop);

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 1,
        })).toBe(true);

        expect(lift.preventDefault).toHaveBeenCalled();
        expect(drop.preventDefault).toHaveBeenCalled();
      });
    });

    describe('cancel', () => {
      it('should cancel the drag when the user presses escape and prevent default on the event', () => {
        const mockEvent: MockEvent = createMockEvent();

        pressSpacebar(wrapper);
        pressEscape(wrapper, mockEvent);

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
        expect(mockEvent.preventDefault).toHaveBeenCalled();
      });

      it('should cancel when the user pushes any mouse button', () => {
        const mouseButtons: number[] = [primaryButton, auxiliaryButton];

        mouseButtons.forEach((button: number, index: number): void => {
          const upArrowMock: MockEvent = createMockEvent();

          pressSpacebar(wrapper);
          const mouseDownEvent: MouseEvent = windowMouseDown(origin, button);
          // should now do nothing
          pressArrowUp(wrapper, upArrowMock);

          expect(callbacksCalled(callbacks)({
            onLift: index + 1,
            onCancel: index + 1,
          })).toBe(true);
          expect(mouseDownEvent.defaultPrevented).toBe(false);
          expect(upArrowMock.preventDefault).not.toHaveBeenCalled();
        });
      });

      it('should not do anything if there is nothing dragging', () => {
        const event: KeyboardEvent = windowEscape();

        expect(whereAnyCallbacksCalled(callbacks)).toBe(false);
        expect(event.defaultPrevented).toBe(false);
      });

      it('should not prevent any subsequent click actions', () => {
        // lift
        pressSpacebar(wrapper);
        // drop
        pressSpacebar(wrapper);

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 1,
        })).toBe(true);

        expect(isAWindowClickPrevented()).toBe(false);
      });
    });

    describe('post drag click', () => {
      it('should not prevent any clicks after a drag', () => {
        const mockEvent: MockEvent = createMockEvent();
        pressSpacebar(wrapper);
        pressArrowDown(wrapper);
        pressSpacebar(wrapper);

        mouseClick(wrapper, origin, primaryButton, mockEvent);

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

      it('should stop preventing default action on events', () => {
        // setup
        pressSpacebar(wrapper);
        wrapper.setProps({
          isEnabled: false,
        });
        // validation
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);

        // test
        const mockEvent: MockEvent = createMockEvent();
        pressArrowDown(wrapper, mockEvent);
        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
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
        const arrowDownMock: MockEvent = createMockEvent();
        pressArrowDown(wrapper, arrowDownMock);
        requestAnimationFrame.step();

        const arrowUpMock: MockEvent = createMockEvent();
        pressArrowUp(wrapper);
        requestAnimationFrame.step();

        const escapeEvent: KeyboardEvent = windowEscape();
        requestAnimationFrame.step();

        // being super safe
        requestAnimationFrame.flush();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 0,
        })).toBe(true);
        expect(arrowDownMock.preventDefault).not.toHaveBeenCalled();
        expect(arrowUpMock.preventDefault).not.toHaveBeenCalled();
        expect(escapeEvent.defaultPrevented).toBe(false);
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

      it('should not call preventDefault on the initial touchstart as we are not sure if the user is dragging yet', () => {
        const mockEvent: MockEvent = createMockEvent();

        touchStart(wrapper, origin, 0, mockEvent);

        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      });
    });

    describe('drag ending before it started', () => {
      it('should not start a drag before a long press', () => {
        touchStart(wrapper);
        // have not waited long enough
        jest.runTimersToTime(timeForLongPress - 1);

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
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

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
        // letting the movement event flow through - this enables native scrolling
        expect(event.defaultPrevented).toBe(false);
      });

      it('should not start a drag if a touchend is fired', () => {
        touchStart(wrapper);
        // ended before timer finished
        const event: Event = windowTouchEnd();
        // flush all timers
        jest.runAllTimers();

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
        expect(event.defaultPrevented).toBe(false);
      });

      it('should not start a drag if a touchcancel is fired', () => {
        touchStart(wrapper);
        // cancelled before timer finished
        const event: Event = windowTouchCancel();
        // flush all timers
        jest.runAllTimers();

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
        expect(event.defaultPrevented).toBe(false);
      });

      it('should not start a drag if a touchstart is fired', () => {
        touchStart(wrapper);
        // this should not be possible - but testing it anyway
        const event: Event = windowTouchStart();
        // flush all timers
        jest.runAllTimers();

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
        expect(event.defaultPrevented).toBe(false);
      });

      it('should not start a drag after a resize', () => {
        touchStart(wrapper);
        // resize before timer finished
        const event: Event = dispatchWindowEvent('resize');
        // flush all timers
        jest.runAllTimers();

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
        expect(event.defaultPrevented).toBe(false);
      });

      it('should not start a drag after a orientation change', () => {
        touchStart(wrapper);
        const event: Event = dispatchWindowEvent('orientationchange');
        // flush all timers
        jest.runAllTimers();

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
        expect(event.defaultPrevented).toBe(false);
      });

      it('should not start a drag after a window scroll', () => {
        touchStart(wrapper);
        const event: Event = dispatchWindowEvent('scroll');
        // flush all timers
        jest.runAllTimers();

        expect(callbacksCalled(callbacks)({
          onLift: 0,
        })).toBe(true);
        expect(event.defaultPrevented).toBe(false);
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

          // should cancel the pending drag without preventing the default action
          const event: KeyboardEvent = dispatchWindowKeyDownEvent(keyCodes[key]);

          // would normally start a drag
          jest.runAllTimers();

          expect(callbacksCalled(callbacks)({
            onLift: 0,
          })).toBe(true);
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

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 1,
        })).toBe(true);
        expect(event.defaultPrevented).toBe(true);
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

      it('should prevent the next click event', () => {
        start();

        // cancel drag
        const keyDownEvent: KeyboardEvent = windowEscape();
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);

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
          const event: Event = windowTouchMove({ x: 100, y: 200 });
          requestAnimationFrame.step();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onCancel: 0,
          })).toBe(true);
          expect(event.defaultPrevented).toBe(false);
        });
      });

      it('should cancel the drag if a touchcancel is fired', () => {
        const event: Event = windowTouchCancel();

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
        // a direct cancel
        expect(event.defaultPrevented).toBe(true);
      });

      it('should cancel the drag after a resize', () => {
        const event: Event = dispatchWindowEvent('resize');

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
        // an indirect cancel
        expect(event.defaultPrevented).toBe(false);
      });

      it('should cancel the drag after a orientation change', () => {
        const event: Event = dispatchWindowEvent('orientationchange');

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
        // an indirect cancel
        expect(event.defaultPrevented).toBe(false);
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
          const event: KeyboardEvent = dispatchWindowKeyDownEvent(keyCodes[key]);

          expect(callbacksCalled(callbacks)({
            // initial lift + index + 1
            onLift: index + 2,
            // index + 1
            onCancel: index + 1,
            // initial drop
            onDrop: 1,
          })).toBe(true);

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

        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onCancel: 1,
        })).toBe(true);
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
      const windowForcePress = (force?: number = forcePressThreshold): Event =>
        dispatchWindowEvent('touchforcechange', {
          touches: [{
            force,
          }],
        });

      describe('drag not yet started', () => {
        it('should not start a drag if a force press occurs', () => {
          touchStart(wrapper);
          const event: Event = windowForcePress(forcePressThreshold);
          // would normally start a drag
          jest.runAllTimers();

          expect(callbacksCalled(callbacks)({
            onLift: 0,
          })).toBe(true);
          // This is an indirect cancel
          expect(event.defaultPrevented).toBe(false);
        });

        it('should not block lifting if the force press is not strong enough', () => {
          touchStart(wrapper);
          windowForcePress(forcePressThreshold - 0.1);
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
          const event: Event = windowForcePress();

          expect(callbacksCalled(callbacks)({
            onLift: 1,
            onCancel: 1,
          })).toBe(true);
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

            expect(callbacksCalled(callbacks)({
              onLift: 1,
              onCancel: 0,
            })).toBe(true);
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
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 1,
        })).toBe(true);

        // second drag start unsuccessful
        // manually firing a window touch event as enzyme will not
        // publish the synthetic event up the tree
        touchStart(wrapper);
        windowTouchStart();
        end();
        // no lift or drop occurred
        expect(callbacksCalled(callbacks)({
          onLift: 1,
          onDrop: 1,
        })).toBe(true);

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
          isDropAnimating={false}
          direction={null}
          getDraggableRef={() => singleRef}
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
      drop: (wrap?: ReactWrapper) => void,
      cleanup: () => void,
    |}

    const trySetIsDragging = (wrap: ReactWrapper) => {
      // potentially not looking at the root wrapper
      if (!wrap.props().callbacks) {
        return;
      }

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
      drop: () => {
        windowTouchEnd();
      },
      cleanup: () => {
        windowMouseClick();
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
      drop: (wrap?: ReactWrapper = wrapper) => {
        // only want to fire the event if dragging - otherwise it might start a drag
        if (wrap.props().isDragging) {
          pressSpacebar(wrap);
        }
      },
      // no cleanup required
      cleanup: () => { },
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
      drop: () => {
        windowMouseUp();
      },
      cleanup: () => {
        windowMouseClick();
      },
    };

    const controls: Control[] = [mouse, keyboard, touch];

    controls.forEach((control: Control) => {
      describe(`control: ${control.name}`, () => {
        afterEach(() => {
          control.cleanup();
        });

        describe('window bindings', () => {
          it('should unbind all window listeners when drag ends', () => {
            jest.spyOn(window, 'addEventListener');
            jest.spyOn(window, 'removeEventListener');
            // We need to exclude event listener bindings for error events
            // Enzyme adds them to support componentDidCatch testing
            const countWithErrorsExcluded = (stub): number => stub.mock.calls
              .filter((args: mixed[]) => args[0] !== 'error').length;
            const getAddCount = (): number =>
              countWithErrorsExcluded(window.addEventListener);
            const getRemoveCount = (): number =>
              countWithErrorsExcluded(window.removeEventListener);

            // initial validation
            expect(getAddCount()).toBe(0);
            expect(getRemoveCount()).toBe(0);

            control.preLift();
            control.lift();

            // window events bound
            expect(getAddCount()).toBeGreaterThan(0);
            // nothing unbound yet
            expect(getRemoveCount()).toBe(0);

            // ending the drag
            control.drop();

            if (!control.hasPostDragClickBlocking) {
              expect(getAddCount()).toBe(getRemoveCount());
            } else {
              // we have added post drag listeners
              expect(getAddCount()).toBeGreaterThan(getRemoveCount());

              // finish the post drag blocking
              windowMouseClick();

              // everything is now unbound
              expect(getAddCount()).toBe(getRemoveCount());
            }

            // cleanup
            window.addEventListener.mockRestore();
            window.removeEventListener.mockRestore();
          });

          it('should bind window scroll listeners as non-capture to avoid picking up droppable scroll events', () => {
            // Scroll events on elements do not bubble, but they go through the capture phase
            // https://twitter.com/alexandereardon/status/985994224867819520
            jest.spyOn(window, 'addEventListener');
            jest.spyOn(window, 'removeEventListener');

            control.preLift();
            control.lift();

            const binding = window.addEventListener.mock.calls.find(call => call[0] === 'scroll');

            if (!binding) {
              throw new Error('Count not find scroll binding');
            }

            // 0: function name
            // 1: function
            // 2: options
            const options: Object = binding[2];
            expect(options.capture).toBe(false);

            // cleanup
            window.addEventListener.mockRestore();
            window.removeEventListener.mockRestore();
            control.drop();
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
                control.drop(wrapper);

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
                  control.drop(wrapper);

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
                control.drop(wrapper);

                expect(callbacksCalled(callbacks)({
                  onLift: 0,
                })).toBe(true);
              });
            });

            it('should not start a drag if the parent is interactive and the child is an SVG', () => {
              // $ExpectError - flow does not know about SVGElement yet
              const svg: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
              expect(svg instanceof SVGElement).toBe(true);

              mixedCase(interactiveTagNames).forEach((tagName: string) => {
                const parent: HTMLElement = document.createElement(tagName);
                parent.appendChild(svg);
                const options = {
                  target: svg,
                };

                control.preLift(wrapper, options);
                control.lift(wrapper, options);
                control.drop(wrapper);

                expect(callbacksCalled(callbacks)({
                  onLift: 0,
                })).toBe(true);
              });
            });

            it('should start a drag on a Element with an interactive parent if asked to by user', () => {
              // allowing dragging from interactive elements
              wrapper.setProps({ canDragInteractiveElements: true });

              // $ExpectError - flow does not know about SVGElement yet
              const svg: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
              expect(svg instanceof SVGElement).toBe(true);

              const div: HTMLElement = document.createElement('div');
              expect(div instanceof HTMLElement).toBe(true);

              [div, svg].forEach((child: Element) => {
                mixedCase(interactiveTagNames).forEach((tagName: string) => {
                  const parent: HTMLElement = document.createElement(tagName);
                  parent.appendChild(child);
                  const options = {
                    target: child,
                  };

                  expect(callbacksCalled(callbacks)({
                    onLift: 0,
                    onDrop: 0,
                  })).toBe(true);

                  control.preLift(wrapper, options);
                  control.lift(wrapper, options);
                  control.drop(wrapper);

                  expect(callbacksCalled(callbacks)({
                    onLift: 1,
                    onDrop: 1,
                  })).toBe(true);

                  // cleanup
                  resetCallbacks(callbacks);
                  parent.removeChild(child);
                });
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
                  control.drop(wrapper);

                  expect(callbacksCalled(callbacks)({
                    onLift: count,
                    onDrop: count,
                  })).toBe(true);
                });
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
                  isDropAnimating={false}
                  isEnabled
                  direction={null}
                  getDraggableRef={() => singleRef}
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
              control.drop(customWrapper);

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
                  isDropAnimating={false}
                  isEnabled
                  direction={null}
                  getDraggableRef={() => singleRef}
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
              control.drop(customWrapper);

              expect(whereAnyCallbacksCalled(customCallbacks)).toBe(false);
            });

            it('should block the drag if originated from a child of a child contenteditable', () => {
              const customCallbacks = getStubCallbacks();
              const customWrapper = mount(
                <DragHandle
                  draggableId={draggableId}
                  callbacks={customCallbacks}
                  isDragging={false}
                  isDropAnimating={false}
                  isEnabled
                  direction={null}
                  getDraggableRef={() => singleRef}
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
              control.drop(customWrapper);

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
                  isDropAnimating={false}
                  isEnabled
                  direction={null}
                  getDraggableRef={() => singleRef}
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
              control.drop(customWrapper);

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
                  isDropAnimating={false}
                  isEnabled
                  direction={null}
                  getDraggableRef={() => singleRef}
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
              control.drop(customWrapper);

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
                  isDropAnimating={false}
                  isEnabled
                  direction={null}
                  getDraggableRef={() => singleRef}
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
              control.drop(customWrapper);

              expect(callbacksCalled(customCallbacks)({
                onLift: 1,
                onDrop: 1,
              })).toBe(true);
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
                isDropAnimating={false}
                isEnabled
                direction={null}
                getDraggableRef={() => singleRef}
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
            control.drop(customWrapper);

            expect(callbacksCalled(customCallbacks)({
              onLift: 0,
            })).toBe(true);
            expect(canLift).toHaveBeenCalledWith(draggableId);
          });
        });

        describe('lifting with nested drag handles', () => {
          it('should not start a drag on a parent if a child drag handle has already received the event', () => {
            const parentCallbacks = getStubCallbacks();
            const childCallbacks = getStubCallbacks();
            const nested: ReactWrapper = getNestedWrapper(parentCallbacks, childCallbacks);
            const child: ReactWrapper = nested.find('.child').first();

            // React enzyme will bubble events within a wrapper
            control.preLift(child);
            control.lift(child);

            expect(childCallbacks.onLift).toHaveBeenCalled();
            expect(parentCallbacks.onLift).not.toHaveBeenCalled();

            nested.unmount();
          });

          it('should start a drag on a parent the event is trigged on the parent', () => {
            const parentCallbacks = getStubCallbacks();
            const childCallbacks = getStubCallbacks();
            const nested: ReactWrapper = getNestedWrapper(parentCallbacks, childCallbacks);
            const parent: ReactWrapper = nested.find('.parent').first();

            control.preLift(parent);
            control.lift(parent);

            expect(childCallbacks.onLift).not.toHaveBeenCalled();
            expect(parentCallbacks.onLift).toHaveBeenCalled();

            nested.unmount();
          });
        });

        describe('page visibility changes', () => {
          it('should cancel the drag on page visibility changes', () => {
            control.preLift();
            control.lift();

            dispatchWindowEvent('visibilitychange');

            expect(callbacksCalled(callbacks)({
              onLift: 1,
              onCancel: 1,
            })).toBe(true);

            control.drop();
          });
        });
      });
    });
  });
});
