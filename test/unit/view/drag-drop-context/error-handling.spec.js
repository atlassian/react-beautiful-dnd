// @flow
import React from 'react';
import invariant from 'tiny-invariant';
import { mount, type ReactWrapper } from 'enzyme';
import DragDropContext from '../../../../src/view/drag-drop-context';
import Droppable from '../../../../src/view/droppable';
import type { Provided as DroppableProvided } from '../../../../src/view/droppable/droppable-types';
import Draggable from '../../../../src/view/draggable';
import * as keyCodes from '../../../../src/view/key-codes';
import type {
  Provided as DraggableProvided,
  StateSnapshot as DraggableStateSnapshot,
} from '../../../../src/view/draggable/draggable-types';

type Props = {|
  provided: DraggableProvided,
  snapshot: DraggableStateSnapshot,
  throw: () => void,
|};

class WillThrow extends React.Component<Props> {
  componentDidUpdate(previous: Props) {
    if (!previous.snapshot.isDragging && this.props.snapshot.isDragging) {
      this.props.throw();
    }
  }
  render() {
    const provided: DraggableProvided = this.props.provided;
    return (
      <div
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        ref={provided.innerRef}
      >
        Drag me
      </div>
    );
  }
}
it('should reset the application state if an invariant exception occurs', () => {
  jest.useFakeTimers();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});

  const wrapper: ReactWrapper = mount(
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="droppable">
        {(droppableProvided: DroppableProvided) => (
          <div
            {...droppableProvided.droppableProps}
            ref={droppableProvided.innerRef}
          >
            <Draggable draggableId="draggable" index={0}>
              {(
                draggableProvided: DraggableProvided,
                snapshot: DraggableStateSnapshot,
              ) => (
                <WillThrow
                  provided={draggableProvided}
                  snapshot={snapshot}
                  throw={() => invariant(false)}
                />
              )}
            </Draggable>
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>,
  );

  // nothing bad has happened yet
  expect(console.warn).not.toHaveBeenCalled();
  expect(console.error).not.toHaveBeenCalled();

  // Execute a lift which will throw an error
  wrapper.find(WillThrow).simulate('keydown', { keyCode: keyCodes.space });
  // throw is swallowed
  expect(() => jest.runOnlyPendingTimers()).not.toThrow();
  // Messages printed
  expect(console.warn).toHaveBeenCalledWith(
    expect.stringContaining('Any existing drag will be cancelled'),
  );
  expect(console.error).toHaveBeenCalled();

  // WillThrough can still be found in the DOM
  const willThrough: ReactWrapper = wrapper.find(WillThrow);
  expect(willThrough.length).toBeTruthy();
  const expected: DraggableStateSnapshot = {
    draggingOver: null,
    isDragging: false,
  };
  // no longer dragging
  expect(willThrough.props().snapshot).toEqual(expected);

  // cleanup
  console.error.mockRestore();
  console.warn.mockRestore();
  jest.useRealTimers();
});
