// @flow
import React from 'react';
import { getRect } from 'css-box-model';
import { render, fireEvent } from '@testing-library/react';
import * as keyCodes from '../../../src/view/key-codes';
import type {
  DraggableProvided,
  DroppableProvided,
  DragStart,
  DragUpdate,
  DropResult,
} from '../../../src';
import type { Responders } from '../../../src/types';
import { DragDropContext, Droppable, Draggable } from '../../../src';
import { getComputedSpacing } from '../../utils/dimension';
import { simpleLift, keyboard } from './utils/controls';

// Both list and item will have the same dimensions
jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() =>
  getRect({
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
  }),
);

// Stubbing out totally - not including margins in this
jest
  .spyOn(window, 'getComputedStyle')
  .mockImplementation(() => getComputedSpacing({}));

type State = {|
  isCombineEnabled: boolean,
|};

class App extends React.Component<*, State> {
  state: State = {
    isCombineEnabled: false,
  };

  onDragStart = (start: DragStart) => {
    this.props.onDragStart(start);
    this.setState({ isCombineEnabled: true });
  };

  onDragUpdate = (update: DragUpdate) => {
    this.props.onDragUpdate(update);
  };

  onDragEnd = (result: DropResult) => {
    this.props.onDragEnd(result);
    this.setState({ isCombineEnabled: false });
  };
  // Normally you would want to split things out into separate components.
  // But in this example everything is just done in one place for simplicity
  render() {
    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragUpdate={this.onDragUpdate}
        onDragEnd={this.onDragEnd}
      >
        <Droppable
          droppableId="droppable"
          direction="horizontal"
          isCombineEnabled={this.state.isCombineEnabled}
        >
          {(droppableProvided: DroppableProvided) => (
            <div
              ref={droppableProvided.innerRef}
              {...droppableProvided.droppableProps}
            >
              <Draggable draggableId="first" index={0}>
                {(draggableProvided: DraggableProvided) => (
                  <div
                    ref={draggableProvided.innerRef}
                    data-testid="drag-handle-1"
                    {...draggableProvided.draggableProps}
                    {...draggableProvided.dragHandleProps}
                  >
                    First
                  </div>
                )}
              </Draggable>
              <Draggable draggableId="second" index={1}>
                {(draggableProvided: DraggableProvided) => (
                  <div
                    ref={draggableProvided.innerRef}
                    data-testid="drag-handle-2"
                    {...draggableProvided.draggableProps}
                    {...draggableProvided.dragHandleProps}
                  >
                    Second
                  </div>
                )}
              </Draggable>
              {droppableProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}

jest.useFakeTimers();
it('should allow the changing of combining in onDragStart', () => {
  const responders: Responders = {
    onDragStart: jest.fn(),
    onDragUpdate: jest.fn(),
    onDragEnd: jest.fn(),
  };
  const { getByTestId } = render(<App {...responders} />);

  const handle: HTMLElement = getByTestId('drag-handle-1');
  simpleLift(keyboard, handle);
  // flush onDragStart  responder
  jest.runOnlyPendingTimers();

  const start: DragStart = {
    draggableId: 'first',
    source: {
      droppableId: 'droppable',
      index: 0,
    },
    type: 'DEFAULT',
    mode: 'SNAP',
  };
  expect(responders.onDragStart).toHaveBeenCalledWith(start);

  // now moving down will cause a combine impact!
  fireEvent.keyDown(handle, { keyCode: keyCodes.arrowDown });
  jest.runOnlyPendingTimers();
  const update: DragUpdate = {
    ...start,
    destination: null,
    combine: {
      draggableId: 'second',
      droppableId: 'droppable',
    },
  };
  expect(responders.onDragUpdate).toHaveBeenCalledWith(update);
});
