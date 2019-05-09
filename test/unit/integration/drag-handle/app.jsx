// @flow
import React, { useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DroppableProvided,
  type DraggableProvided,
  type DraggableStateSnapshot,
  type Sensor,
} from '../../../../src';

type Item = {|
  id: string,
|};

type Props = {|
  onDragStart?: Function,
  onDragEnd?: Function,
  sensors?: [Sensor],
|};

function noop() {}

export default function App(props?: Props) {
  const onDragStart = (props && props.onDragStart) || noop;
  const onDragEnd = (props && props.onDragStart) || noop;
  const sensors: Sensor[] = [...((props && props.sensors) || [])];

  const [items] = useState(() =>
    Array.from(
      { length: 3 },
      (v, k): Item => ({
        id: `${k}`,
      }),
    ),
  );

  return (
    <DragDropContext
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      __unstableSensors={sensors}
    >
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
