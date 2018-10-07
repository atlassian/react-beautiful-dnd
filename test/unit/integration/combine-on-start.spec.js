// @flow
import React from 'react';
import { getRect } from 'css-box-model';
import { mount, type ReactWrapper } from 'enzyme';
import { withKeyboard } from '../../utils/user-input-util';
import * as keyCodes from '../../../src/view/key-codes';
import type {
  DraggableProvided,
  DroppableProvided,
  DragStart,
  DragUpdate,
  DropResult,
} from '../../../src';
import type { Hooks } from '../../../src/types';
import { DragDropContext, Droppable, Draggable } from '../../../src';
import { getComputedSpacing } from '../../utils/dimension';

const pressSpacebar = withKeyboard(keyCodes.space);
const pressArrowDown = withKeyboard(keyCodes.arrowDown);

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
                    className="drag-handle"
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
                    className="drag-handle"
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
  const hooks: Hooks = {
    onDragStart: jest.fn(),
    onDragUpdate: jest.fn(),
    onDragEnd: jest.fn(),
  };
  const wrapper: ReactWrapper = mount(<App {...hooks} />);

  pressSpacebar(wrapper.find('.drag-handle').first());
  // flush onDragStart  hook
  jest.runOnlyPendingTimers();

  const start: DragStart = {
    draggableId: 'first',
    source: {
      droppableId: 'droppable',
      index: 0,
    },
    payload: null,
    type: 'DEFAULT',
    mode: 'SNAP',
  };
  expect(hooks.onDragStart).toHaveBeenCalledWith(start);

  // now moving down will cause a combine impact!
  pressArrowDown(wrapper.find('.drag-handle').first());
  jest.runOnlyPendingTimers();
  const update: DragUpdate = {
    ...start,
    destination: null,
    combine: {
      draggableId: 'second',
      droppableId: 'droppable',
    },
  };
  expect(hooks.onDragUpdate).toHaveBeenCalledWith(update);
});
