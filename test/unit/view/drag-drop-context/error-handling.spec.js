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
  throwFn: () => void,
|};

class WillThrow extends React.Component<Props> {
  componentDidUpdate(previous: Props) {
    if (!previous.snapshot.isDragging && this.props.snapshot.isDragging) {
      this.props.throwFn();
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

const withThrow = (throwFn: Function): ReactWrapper =>
  mount(
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
                  throwFn={throwFn}
                />
              )}
            </Draggable>
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>,
  );

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  // cleanup
  console.error.mockRestore();
  console.warn.mockRestore();
  jest.useRealTimers();
});

it('should reset the application state and swallow the exception if an invariant exception occurs', () => {
  const wrapper: ReactWrapper = withThrow(() => invariant(false));

  // Execute a lift which will throw an error
  wrapper.find(WillThrow).simulate('keydown', { keyCode: keyCodes.space });
  // throw is swallowed
  expect(() => jest.runOnlyPendingTimers()).not.toThrow();
  // Message printed
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining('An error has occurred while a drag is occurring'),
    expect.any(Error),
  );

  // WillThrough can still be found in the DOM
  const willThrough: ReactWrapper = wrapper.find(WillThrow);
  expect(willThrough.length).toBeTruthy();
  const expected: DraggableStateSnapshot = {
    draggingOver: null,
    isDragging: false,
    isDropAnimating: false,
  };
  // no longer dragging
  expect(willThrough.props().snapshot).toEqual(expected);
});

it('should not reset the application state an exception occurs and throw it', () => {
  const wrapper: ReactWrapper = withThrow(() => {
    throw new Error('YOLO');
  });

  // Execute a lift which will throw an error
  wrapper.find(WillThrow).simulate('keydown', { keyCode: keyCodes.space });
  // throw is NOT swallowed
  expect(() => jest.runOnlyPendingTimers()).toThrow();
  // Messages printed
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining('An error has occurred while a drag is occurring'),
    expect.any(Error),
  );

  const willThrough: ReactWrapper = wrapper.find(WillThrow);
  expect(willThrough.length).toBeTruthy();
  const expected: DraggableStateSnapshot = {
    draggingOver: null,
    isDragging: false,
    isDropAnimating: false,
  };
  // no longer dragging
  expect(willThrough.props().snapshot).toEqual(expected);
});
