// @flow
import React, { type Node } from 'react';
import { render } from '@testing-library/react';
import { noop } from '../../../../src/empty';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DroppableProvided,
  type DraggableProvided,
  type DraggableStateSnapshot,
  type DraggableLocation,
} from '../../../../src';
import { simpleLift, keyboard } from '../util/controls';
import getBodyElement from '../../../../src/view/get-body-element';

function isAClone(el: HTMLElement): boolean {
  return el.getAttribute('data-is-clone') === 'true';
}

const defaultChildFn = (
  provided: DraggableProvided,
  snapshot: DraggableStateSnapshot,
  location?: DraggableLocation,
) => (
  <div
    {...provided.draggableProps}
    {...provided.dragHandleProps}
    data-testid="draggable"
    data-is-clone={Boolean(location)}
    data-is-dragging={snapshot.isDragging}
    ref={provided.innerRef}
  >
    hi there
  </div>
);

type Props = {
  getContainerForClone?: () => HTMLElement,
  children?: (
    provided: DraggableProvided,
    snapshot: DraggableStateSnapshot,
    location?: DraggableLocation,
  ) => Node,
};

function WithClone(props: Props) {
  const child = props.children || defaultChildFn;
  return (
    <DragDropContext onDragEnd={noop}>
      <Droppable
        droppableId="droppable"
        whenDraggingClone={child}
        getContainerForClone={props.getContainerForClone}
      >
        {(provided: DroppableProvided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            <Draggable draggableId="draggable" index={0}>
              {child}
            </Draggable>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

it('should no longer render the original draggable while dragging', () => {
  const { getByTestId } = render(<WithClone />);

  // doing this in a loop to ensure that multiple reorders is fine
  Array.from({ length: 4 }).forEach(() => {
    const beforeLift = getByTestId('draggable');
    simpleLift(keyboard, beforeLift);
    expect(isAClone(beforeLift)).toBe(false);

    // after lift there is still only one item - but it is different
    const clone = getByTestId('draggable');
    expect(clone).not.toBe(beforeLift);
    expect(isAClone(clone)).toBe(true);

    keyboard.drop(clone);

    const finished = getByTestId('draggable');
    expect(finished).not.toBe(clone);
    expect(isAClone(finished)).toBe(false);
  });
});

it('should render a dragging item into the container', () => {
  const body = getBodyElement();
  // default location is the body
  {
    const { unmount, getByTestId } = render(<WithClone />);
    simpleLift(keyboard, getByTestId('draggable'));
    expect(getByTestId('draggable').parentElement).toBe(body);
    unmount();
  }
  {
    const element: HTMLElement = document.createElement('div');
    body.appendChild(element);
    const { unmount, getByTestId } = render(
      <WithClone getContainerForClone={() => element} />,
    );
    simpleLift(keyboard, getByTestId('draggable'));
    expect(getByTestId('draggable').parentElement).toBe(element);
    unmount();
  }
});

it('should give the clone the starting location', () => {
  const spy = jest.fn().mockImplementation(defaultChildFn);
  const { getByTestId } = render(<WithClone>{spy}</WithClone>);

  simpleLift(keyboard, getByTestId('draggable'));

  const location = spy.mock.calls[spy.mock.calls.length - 1][2];
  const expected: DraggableLocation = {
    droppableId: 'droppable',
    index: 0,
  };
  expect(location).toEqual(expected);
});

// How to test this without sniffing the marshals?
// What is the behaviour we want to avoid by registering?
it('should not register or unregister itself with registry or marshal', () => {});
