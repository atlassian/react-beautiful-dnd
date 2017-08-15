// @flow
import React from 'react';
import { mount } from 'enzyme';
import { DragDropContext, Draggable, Droppable } from '../../../src/';
import { sloppyClickThreshold } from '../../../src/view/drag-handle/drag-handle';
import { dispatchWindowMouseEvent, dispatchWindowKeyDownEvent, mouseEvent } from '../../utils/user-input-util';
import getClientRect from '../../utils/get-client-rect';
import type {
  Hooks,
  DraggableLocation,
  DraggableId,
  DroppableId,
  DropResult,
  Position,
} from '../../../src/types';
import type { Provided as DraggableProvided } from '../../../src/view/draggable/draggable-types';
import type { Provided as DroppableProvided } from '../../../src/view/droppable/droppable-types';
import * as keyCodes from '../../../src/view/key-codes';

const windowMouseMove = dispatchWindowMouseEvent.bind(null, 'mousemove');
const windowMouseUp = dispatchWindowMouseEvent.bind(null, 'mouseup');
const mouseDown = mouseEvent.bind(null, 'mousedown');
const cancelWithKeyboard = dispatchWindowKeyDownEvent.bind(null, keyCodes.escape);

describe('hooks integration', () => {
  let hooks: Hooks;
  let wrapper;

  const draggableId: DraggableId = 'drag-1';
  const droppableId: DroppableId = 'drop-1';

  // both our list and item have the same dimension for now
  const clientRect = getClientRect({
    top: 0,
    right: 100,
    bottom: 100,
    left: 0,
  });

  const getMountedApp = () => {
    // Both list and item will have the same dimensions
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => clientRect);

    // Stubbing out totally - not including margins in this
    jest.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      marginTop: '0',
      marginRight: '0',
      marginBottom: '0',
      marginLeft: '0',
    }));

    return mount(
      <DragDropContext
        onDragStart={hooks.onDragStart}
        onDragEnd={hooks.onDragEnd}
      >
        <Droppable droppableId={droppableId}>
          {(droppableProvided: DroppableProvided) => (
            <div ref={droppableProvided.innerRef} >
              <h2>Droppable</h2>
              <Draggable draggableId={draggableId}>
                {(draggableProvided: DraggableProvided) => (
                  <div
                    className="drag-handle"
                    ref={draggableProvided.innerRef}
                    style={draggableProvided.draggableStyle}
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
    requestAnimationFrame.reset();
    jest.useFakeTimers();
    hooks = {
      onDragStart: jest.fn(),
      onDragEnd: jest.fn(),
    };
    wrapper = getMountedApp();
  });

  afterEach(() => {
    requestAnimationFrame.reset();
    jest.useRealTimers();

    // clean up any loose events
    wrapper.unmount();

    // clean up any stubs
    if (Element.prototype.getBoundingClientRect.mockRestore) {
      Element.prototype.getBoundingClientRect.mockRestore();
    }
    if (window.getComputedStyle.mockRestore) {
      window.getComputedStyle.mockRestore();
    }
  });

  const drag = (() => {
    const initial: Position = {
      x: clientRect.left + 1,
      y: clientRect.top + 1,
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
      mouseDown(
        wrapper.find('.drag-handle'),
        initial.x,
        initial.y,
      );

      // Drag does not start until mouse has moved past a certain threshold
      windowMouseMove(dragStart.x, dragStart.y);

      // Need to wait for the nested async lift action to complete
      // this takes two async actions.
      jest.runAllTimers();
    };

    const move = () => {
      windowMouseMove(dragMove.x, dragMove.y + sloppyClickThreshold + 1);
      // movements are scheduled with requestAnimationFrame
      requestAnimationFrame.step();
    };

    const waitForReturnToHome = () => {
      // flush the return to home animation
      requestAnimationFrame.flush();

      // animation finishing waits a tick before calling the callback
      jest.runOnlyPendingTimers();
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
    const start: DraggableLocation = {
      droppableId,
      index: 0,
    };

      // Unless we do some more hardcore stubbing
      // both completed and cancelled look the same.
      // Ideally we would move one item below another
    const completed: DropResult = {
      draggableId,
      source: start,
      destination: null,
    };

    const cancelled: DropResult = {
      draggableId,
      source: start,
      destination: null,
    };

    return { completed, cancelled };
  })();

  const wasDragStarted = (amountOfDrags?: number = 1) => {
    expect(hooks.onDragStart).toHaveBeenCalledTimes(amountOfDrags);
    // $ExpectError - type of hook function
    expect(hooks.onDragStart.mock.calls[amountOfDrags - 1])
      .toEqual([draggableId, expected.completed.source]);
  };

  const wasDragCompleted = (amountOfDrags?: number = 1) => {
    expect(hooks.onDragEnd).toHaveBeenCalledTimes(amountOfDrags);
    expect(hooks.onDragEnd.mock.calls[amountOfDrags - 1][0])
      .toEqual(expected.completed);
  };

  const wasDragCancelled = (amountOfDrags?: number = 1) => {
    expect(hooks.onDragEnd).toHaveBeenCalledTimes(amountOfDrags);
    expect(hooks.onDragEnd.mock.calls[amountOfDrags - 1][0])
      .toEqual(expected.cancelled);
  };

  describe('drag start', () => {
    it('should call the onDragStart hook when a drag starts', () => {
      drag.start();

      wasDragStarted();
    });

    it('should not call onDragStart while the drag is occurring', () => {
      drag.start();
      wasDragStarted();

      drag.move();

      // should not have called on drag start again
      expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
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
      wasDragStarted(1);
      wasDragCancelled(1);

      drag.perform();
      wasDragStarted(2);
      wasDragCompleted(2);
    });
  });
});
