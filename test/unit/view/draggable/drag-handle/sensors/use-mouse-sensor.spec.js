// @flow
import React from 'react';
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import { render, fireEvent } from 'react-testing-library';
import {
  Draggable,
  DragDropContext,
  Droppable,
  type DraggableStateSnapshot,
} from '../../../../../../src';
import DroppableContext, {
  type DroppableContextValue,
} from '../../../../../../src/view/context/droppable-context';
import { primaryButton } from '../../../drag-handle/util/events';
import { origin } from '../../../../../../src/state/position';
import { sloppyClickThreshold } from '../../../../../../src/view/use-drag-handle/util/is-sloppy-click-threshold-exceeded';
import { getPreset, getComputedSpacing } from '../../../../../utils/dimension';
import getWindowFromEl from '../../../../../../src/view/window/get-window-from-el';

it('should start a drag if there was sufficient mouse movement', () => {
  let lastSnapshot: DraggableStateSnapshot;

  jest
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(() => getPreset().inHome1.client.borderBox);

  jest
    .spyOn(window, 'getComputedStyle')
    .mockImplementation(() => getComputedSpacing({}));

  const { getByText } = render(
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="droppable">
        {droppableProvided => (
          <div
            {...droppableProvided.droppableProps}
            ref={droppableProvided.innerRef}
          >
            <Draggable draggableId="draggable" index={0}>
              {(provided, snapshot) => {
                lastSnapshot = snapshot;

                return (
                  <div
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    ref={provided.innerRef}
                  >
                    Drag handle
                  </div>
                );
              }}
            </Draggable>
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>,
  );

  invariant(lastSnapshot);
  const handle = getByText('Drag handle');
  fireEvent.mouseDown(handle, {
    button: primaryButton,
    clientX: origin.x,
    clientY: origin.y,
  });

  // not dragging yet
  expect(lastSnapshot.isDragging).toBe(false);

  const point: Position = { x: 0, y: sloppyClickThreshold };
  fireEvent.mouseMove(handle.parentElement, {
    button: primaryButton,
    clientX: point.x,
    clientY: point.y,
  });
  expect(lastSnapshot.isDragging).toBe(true);
});
