// @flow
import React, { useRef } from 'react';
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
import { getComputedSpacing } from '../../../util/dimension';

type Props = {|
  provided: DraggableProvided,
  snapshot: DraggableStateSnapshot,
  throwFn: () => void,
|};

// Stubbing out totally - not including margins in this
jest
  .spyOn(window, 'getComputedStyle')
  .mockImplementation(() => getComputedSpacing({}));

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

const withThrow = (throwFn: Function): ReactWrapper<*> =>
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
  // $ExpectError - mocked console
  console.error.mockRestore();
  // $ExpectError - mocked console
  console.warn.mockRestore();
  jest.useRealTimers();
});

const whenIdle: DraggableStateSnapshot = {
  draggingOver: null,
  dropAnimation: null,
  isDropAnimating: false,
  isDragging: false,
  combineWith: null,
  combineTargetFor: null,
  mode: null,
};

it('should reset the application state and swallow the exception if an invariant exception occurs', () => {
  const wrapper: ReactWrapper<*> = withThrow(() => invariant(false));

  // Execute a lift which will throw an error
  wrapper.find(WillThrow).simulate('keydown', { keyCode: keyCodes.space });
  // throw is swallowed
  expect(() => jest.runOnlyPendingTimers()).not.toThrow();
  // Message printed
  expect(console.error).toHaveBeenCalled();

  // WillThrough can still be found in the DOM
  const willThrough: ReactWrapper<*> = wrapper.find(WillThrow);
  expect(willThrough.length).toBeTruthy();
  // no longer dragging
  expect(willThrough.props().snapshot).toEqual(whenIdle);
});

it('should not reset the application state an exception occurs and throw it', () => {
  const wrapper: ReactWrapper<*> = withThrow(() => {
    throw new Error('YOLO');
  });

  // Execute a lift which will throw an error
  // throw is NOT swallowed
  expect(() =>
    wrapper.find(WillThrow).simulate('keydown', { keyCode: keyCodes.space }),
  ).toThrow();
  // Messages printed
  expect(console.error).toHaveBeenCalled();

  const willThrough: ReactWrapper<*> = wrapper.find(WillThrow);
  expect(willThrough.length).toBeTruthy();
  // no longer dragging
  expect(willThrough.props().snapshot).toEqual(whenIdle);
});

it('should recover from an error on mount', () => {
  function ThrowOnce() {
    const isFirstRenderRef = useRef(true);

    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      invariant(false, 'error on first render');
    }
    return null;
  }
  // This is lame. enzyme is bubbling up errors that where caught in componentDidCatch to the window
  expect(() =>
    mount(
      <DragDropContext onDragEnd={() => {}}>
        <ThrowOnce />
      </DragDropContext>,
    ),
  ).toThrow();
});
