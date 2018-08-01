// @flow
import React from 'react';
import { getRect } from 'css-box-model';
import invariant from 'tiny-invariant';
import { mount, type ReactWrapper } from 'enzyme';
import { DragDropContext, Draggable, Droppable } from '../../../src';
import { getComputedSpacing } from '../../utils/dimension';
import { withKeyboard } from '../../utils/user-input-util';
import * as keyCodes from '../../../src/view/key-codes';
import type { Provided as DraggableProvided } from '../../../src/view/draggable/draggable-types';
import type { Provided as DroppableProvided } from '../../../src/view/droppable/droppable-types';
import type { Hooks } from '../../../src/types';

const pressSpacebar = withKeyboard(keyCodes.space);

type ItemProps = {|
  provided: DraggableProvided,
  onRender: Function,
|};

class Item extends React.Component<ItemProps> {
  render() {
    this.props.onRender();
    const provided: DraggableProvided = this.props.provided;
    return (
      <div
        className="drag-handle"
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <h4>Draggable</h4>
      </div>
    );
  }
}

jest.useFakeTimers();

it('should call the onDragStart before any connected components are updated', () => {
  let onDragStartTime: ?DOMHighResTimeStamp = null;
  let renderTime: ?DOMHighResTimeStamp = null;
  const hooks: Hooks = {
    onDragStart: jest.fn().mockImplementation(() => {
      invariant(!onDragStartTime, 'onDragStartTime already set');
      onDragStartTime = performance.now();
    }),
    onDragEnd: jest.fn(),
  };
  const onItemRender = jest.fn().mockImplementation(() => {
    invariant(!renderTime, 'renderTime already set');
    renderTime = performance.now();
  });
  // Both list and item will have the same dimensions
  jest
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(() =>
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
  const wrapper: ReactWrapper = mount(
    <DragDropContext {...hooks}>
      <Droppable droppableId="droppable">
        {(droppableProvided: DroppableProvided) => (
          <div
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
          >
            <h2>Droppable</h2>
            <Draggable draggableId="draggable" index={0}>
              {(draggableProvided: DraggableProvided) => (
                <Item onRender={onItemRender} provided={draggableProvided} />
              )}
            </Draggable>
          </div>
        )}
      </Droppable>
    </DragDropContext>,
  );

  pressSpacebar(wrapper.find('.drag-handle'));

  // clearing the first call
  expect(onItemRender).toHaveBeenCalledTimes(1);
  renderTime = null;
  onItemRender.mockClear();

  // run out prepare phase
  jest.runOnlyPendingTimers();

  // checking values are set
  invariant(onDragStartTime, 'onDragStartTime should be set');
  invariant(renderTime, 'renderTime should be set');

  // core assertion
  expect(onDragStartTime).toBeLessThan(renderTime);

  // validation
  expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
  expect(onItemRender).toHaveBeenCalledTimes(1);
});
