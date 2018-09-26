// @flow
import invariant from 'tiny-invariant';
import React from 'react';
import { mount } from 'enzyme';
import { getRect, type Rect, type Position } from 'css-box-model';
import { DragDropContext, Draggable, Droppable } from '../../../src';
import { sloppyClickThreshold } from '../../../src/view/drag-handle/util/is-sloppy-click-threshold-exceeded';
import {
  dispatchWindowMouseEvent,
  dispatchWindowKeyDownEvent,
  mouseEvent,
} from '../../utils/user-input-util';
import type {
  Hooks,
  DraggableLocation,
  DraggableId,
  DroppableId,
  DragStart,
  DropResult,
} from '../../../src/types';
import type { Provided as DraggableProvided } from '../../../src/view/draggable/draggable-types';
import type { Provided as DroppableProvided } from '../../../src/view/droppable/droppable-types';
import * as keyCodes from '../../../src/view/key-codes';
import { getComputedSpacing } from '../../utils/dimension';

const windowMouseMove = dispatchWindowMouseEvent.bind(null, 'mousemove');
const windowMouseUp = dispatchWindowMouseEvent.bind(null, 'mouseup');
const mouseDown = mouseEvent.bind(null, 'mousedown');
const cancelWithKeyboard = dispatchWindowKeyDownEvent.bind(
  null,
  keyCodes.escape,
);

describe('hooks integration', () => {
  let hooks: Hooks;
  let wrapper;

  const draggableId: DraggableId = 'drag-1';
  const droppableId: DroppableId = 'drop-1';

  // both our list and item have the same dimension for now
  const borderBox: Rect = getRect({
    top: 0,
    right: 100,
    bottom: 100,
    left: 0,
  });

  const getMountedApp = () => {
    // Both list and item will have the same dimensions
    jest
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockImplementation(() => borderBox);

    // Stubbing out totally - not including margins in this
    jest
      .spyOn(window, 'getComputedStyle')
      .mockImplementation(() => getComputedSpacing({}));

    return mount(
      <DragDropContext
        onBeforeDragStart={hooks.onBeforeDragStart}
        onDragStart={hooks.onDragStart}
        onDragUpdate={hooks.onDragUpdate}
        onDragEnd={hooks.onDragEnd}
      >
        <Droppable droppableId={droppableId}>
          {(droppableProvided: DroppableProvided) => (
            <div
              ref={droppableProvided.innerRef}
              {...droppableProvided.droppableProps}
            >
              <h2>Droppable</h2>
              <Draggable draggableId={draggableId} index={0}>
                {(draggableProvided: DraggableProvided) => (
                  <div
                    className="drag-handle"
                    ref={draggableProvided.innerRef}
                    {...draggableProvided.draggableProps}
                    {...draggableProvided.dragHandleProps}
                  >
                    <h4>Draggable</h4>
                  </div>
                )}
              </Draggable>
            </div>
          )}
        </Droppable>
      </DragDropContext>,
    );
  };

  beforeEach(() => {
    jest.useFakeTimers();
    hooks = {
      onBeforeDragStart: jest.fn(),
      onDragStart: jest.fn(),
      onDragUpdate: jest.fn(),
      onDragEnd: jest.fn(),
    };
    wrapper = getMountedApp();
    // unmounting during a drag can cause a warning
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // clean up any loose events
    wrapper.unmount();
    jest.useRealTimers();

    // clean up any stubs
    if (Element.prototype.getBoundingClientRect.mockRestore) {
      Element.prototype.getBoundingClientRect.mockRestore();
    }
    if (window.getComputedStyle.mockRestore) {
      window.getComputedStyle.mockRestore();
    }

    console.warn.mockRestore();
  });

  const drag = (() => {
    const initial: Position = {
      x: borderBox.left + 1,
      y: borderBox.top + 1,
    };
    const dragStart: Position = {
      x: initial.x,
      y: initial.y + sloppyClickThreshold,
    };
    const dragMove: Position = {
      x: dragStart.x,
      y: dragStart.y + 1,
    };

    const start = () => {
      mouseDown(wrapper.find('.drag-handle'), initial);

      // Drag does not start until mouse has moved past a certain threshold
      windowMouseMove(dragStart);

      // drag start hook is scheduled with setTimeout
      jest.runOnlyPendingTimers();
    };

    const move = () => {
      windowMouseMove({
        x: dragMove.x,
        y: dragMove.y + sloppyClickThreshold + 1,
      });
      // movements are scheduled with setTimeout
      jest.runOnlyPendingTimers();
    };

    const waitForReturnToHome = () => {
      // cheating
      wrapper.find(Draggable).simulate('transitionEnd');
    };

    const stop = () => {
      windowMouseUp();
      waitForReturnToHome();
    };

    const cancel = () => {
      cancelWithKeyboard();
      waitForReturnToHome();
    };

    const perform = () => {
      start();
      move();
      stop();
    };

    return { start, move, stop, cancel, perform };
  })();

  const expected = (() => {
    const source: DraggableLocation = {
      droppableId,
      index: 0,
    };

    const start: DragStart = {
      draggableId,
      type: 'DEFAULT',
      source,
      mode: 'FLUID',
    };

    // Unless we do some more hardcore stubbing
    // both completed and cancelled look the same.
    // Ideally we would move one item below another
    const completed: DropResult = {
      ...start,
      // did not move anywhere
      destination: source,
      combine: null,
      reason: 'DROP',
    };

    const cancelled: DropResult = {
      ...start,
      destination: null,
      combine: null,
      reason: 'CANCEL',
    };

    return { start, completed, cancelled };
  })();

  const wasOnBeforeDragCalled = (
    amountOfDrags?: number = 1,
    provided?: Hooks = hooks,
  ) => {
    invariant(provided.onBeforeDragStart);
    expect(provided.onBeforeDragStart).toHaveBeenCalledTimes(amountOfDrags);
    // $ExpectError - mock property
    expect(provided.onBeforeDragStart.mock.calls[amountOfDrags - 1][0]).toEqual(
      expected.start,
    );
  };

  const wasDragStarted = (
    amountOfDrags?: number = 1,
    provided?: Hooks = hooks,
  ) => {
    invariant(
      provided.onDragStart,
      'cannot validate if drag was started without onDragStart hook',
    );
    expect(provided.onDragStart).toHaveBeenCalledTimes(amountOfDrags);
    // $ExpectError - mock property
    expect(provided.onDragStart.mock.calls[amountOfDrags - 1][0]).toEqual(
      expected.start,
    );
  };

  const wasDragCompleted = (
    amountOfDrags?: number = 1,
    provided?: Hooks = hooks,
  ) => {
    expect(provided.onDragEnd).toHaveBeenCalledTimes(amountOfDrags);
    expect(provided.onDragEnd.mock.calls[amountOfDrags - 1][0]).toEqual(
      expected.completed,
    );
  };

  const wasDragCancelled = (amountOfDrags?: number = 1) => {
    expect(hooks.onDragEnd).toHaveBeenCalledTimes(amountOfDrags);
    expect(hooks.onDragEnd.mock.calls[amountOfDrags - 1][0]).toEqual(
      expected.cancelled,
    );
  };

  describe('before drag start', () => {
    it('should call the onBeforeDragStart hook just before the drag starts', () => {
      drag.start();

      wasOnBeforeDragCalled();

      // cleanup
      drag.stop();
    });

    it('should not call onDragStart while the drag is occurring', () => {
      drag.start();

      wasOnBeforeDragCalled();

      drag.move();

      // should not have called on drag start again
      expect(hooks.onBeforeDragStart).toHaveBeenCalledTimes(1);

      // cleanup
      drag.stop();
    });
  });

  describe('drag start', () => {
    it('should call the onDragStart hook when a drag starts', () => {
      drag.start();

      wasDragStarted();

      // cleanup
      drag.stop();
    });

    it('should not call onDragStart while the drag is occurring', () => {
      drag.start();

      wasDragStarted();

      drag.move();

      // should not have called on drag start again
      expect(hooks.onDragStart).toHaveBeenCalledTimes(1);

      // cleanup
      drag.stop();
    });
  });

  describe('drag end', () => {
    it('should call the onDragEnd hook when a drag ends', () => {
      drag.perform();

      wasDragCompleted();
    });

    it('should call the onDragEnd hook when a drag ends when instantly stopped', () => {
      drag.start();
      drag.stop();

      wasDragCompleted();
    });
  });

  describe('drag cancel', () => {
    it('should call onDragEnd when a drag is canceled', () => {
      drag.start();
      drag.move();
      drag.cancel();

      wasDragCancelled();
    });

    it('should call onDragEnd when a drag is canceled instantly', () => {
      drag.start();
      drag.cancel();

      wasDragCancelled();
    });
  });

  describe('subsequent drags', () => {
    it('should publish subsequent drags', () => {
      drag.perform();
      wasDragStarted(1);
      wasDragCompleted(1);

      drag.perform();
      wasDragStarted(2);
      wasDragCompleted(2);
    });

    it('should publish subsequent drags after a cancel', () => {
      drag.start();
      drag.cancel();
      wasOnBeforeDragCalled(1);
      wasDragStarted(1);
      wasDragCancelled(1);

      drag.perform();
      wasOnBeforeDragCalled(2);
      wasDragStarted(2);
      wasDragCompleted(2);
    });
  });

  describe('dynamic hooks', () => {
    const setHooks = (provided: Hooks) => {
      wrapper.setProps({
        onDragStart: provided.onDragStart,
        onDragEnd: provided.onDragEnd,
      });
    };

    it('should allow you to change hooks before a drag started', () => {
      const newHooks: Hooks = {
        onDragStart: jest.fn(),
        onDragEnd: jest.fn(),
      };
      setHooks(newHooks);

      drag.perform();

      // new hooks called
      wasDragStarted(1, newHooks);
      wasDragCompleted(1, newHooks);
      // original hooks not called
      expect(hooks.onDragStart).not.toHaveBeenCalled();
      expect(hooks.onDragEnd).not.toHaveBeenCalled();
    });

    it('should allow you to change onDragEnd during a drag', () => {
      const newHooks: Hooks = {
        onDragEnd: jest.fn(),
      };

      drag.start();
      // changing the onDragEnd hook during a drag
      setHooks(newHooks);
      drag.stop();

      wasDragStarted(1, hooks);
      // called the new hook that was changed during a drag
      wasDragCompleted(1, newHooks);
      // not calling original hook
      expect(hooks.onDragEnd).not.toHaveBeenCalled();
    });

    it('should allow you to change hooks between drags', () => {
      const newHooks: Hooks = {
        onDragStart: jest.fn(),
        onDragEnd: jest.fn(),
      };

      // first drag
      drag.perform();
      wasDragStarted(1, hooks);
      wasDragCompleted(1, hooks);

      // second drag
      setHooks(newHooks);
      drag.perform();

      // new hooks called for second drag
      wasDragStarted(1, newHooks);
      wasDragCompleted(1, newHooks);
      // original hooks should not have been called again
      wasDragStarted(1, hooks);
      wasDragCompleted(1, hooks);
    });
  });
});
