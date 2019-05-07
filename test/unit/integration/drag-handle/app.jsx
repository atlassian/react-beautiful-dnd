// @flow
import React, { useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DroppableProvided,
  type DraggableProvided,
} from '../../../../src';

type Item = {|
  id: string,
|};

export default function App() {
  const [items] = useState(() =>
    Array.from(
      { length: 3 },
      (v, k): Item => ({
        id: `${k}`,
      }),
    ),
  );

  return (
    <DragDropContext>
      <Droppable droppableId="droppable">
        {(droppableProvided: DroppableProvided) => (
          <div
            {...droppableProvided.droppableProps}
            ref={droppableProvided.innerRef}
          >
            {items.map((item: Item, index: number) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(
                  provided: DraggableProvided,
                  snapshot: DraggableStateSnapshot,
                ) => (
                  <div
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    data-is-dragging={snapshot.isDragging}
                    ref={provided.innerRef}
                  >
                    item: {item.id}
                  </div>
                )}
              </Draggable>
            ))}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
