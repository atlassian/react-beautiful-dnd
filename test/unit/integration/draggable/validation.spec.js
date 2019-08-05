// @flow
import React, { type Node } from 'react';
import { render } from '@testing-library/react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DroppableProvided,
  type DraggableProvided,
} from '../../../../src';
import { noop } from '../../../../src/empty';

type Props = {|
  children: (provided: DraggableProvided) => Node,
|};

function App(props: Props) {
  return (
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="droppable">
        {(provided: DroppableProvided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <Draggable draggableId="draggable" index={0}>
              {props.children}
            </Draggable>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

it('should throw if no draggableId is provided', () => {});

it('should throw if index is not a number', () => {});

it('should throw if innerRef is not provided', () => {});

it('should throw if innerRef is an SVG', () => {});

it.only('should throw if no drag handle props are applied', () => {
  const error = jest.spyOn(console, 'error').mockImplementation(noop);
  const warn = jest.spyOn(console, 'warn').mockImplementation(noop);
  function MyApp() {
    return (
      <App>
        {(provided: DraggableProvided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            /* not being applied */
            /* {...dragProvided.dragHandleProps} */
          >
            Drag me!
          </div>
        )}
      </App>
    );
  }

  render(<MyApp />);
  expect(error).toHaveBeenCalled();

  error.mockRestore();
  warn.mockRestore();
});

it('should not throw if draggable is disabled as there will be no drag handle', () => {});
