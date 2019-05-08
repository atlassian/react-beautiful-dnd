// @flow
import React, { useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DroppableProvided,
  type DraggableProvided,
  type DraggableStateSnapshot,
  type SensorHook,
} from '../../../../src';

type Item = {|
  id: string,
|};

type Props = {|
  onDragStart?: Function,
  onDragEnd?: Function,
  sensors?: [SensorHook],
|};

function noop() {}

export default function App(props?: Props) {
  const onDragStart = (props && props.onDragStart) || noop;
  console.log('on drag start', onDragStart);
  const onDragEnd = (props && props.onDragStart) || noop;

  const [items] = useState(() =>
    Array.from(
      { length: 3 },
      (v, k): Item => ({
        id: `${k}`,
      }),
    ),
  );

  const sensors: SensorHook[] = (props && props.sensors) || [];

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
