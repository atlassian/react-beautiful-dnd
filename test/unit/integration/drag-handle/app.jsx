// @flow
import React, { useState, type Node } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DroppableProvided,
  type DraggableProvided,
  type DraggableStateSnapshot,
  type Sensor,
} from '../../../../src';

export type Item = {|
  id: string,
  isEnabled: boolean,
|};

type Props = {|
  onDragStart?: Function,
  onDragEnd?: Function,
  items?: Item[],
  anotherChild?: Node,

  sensors?: Sensor[],
  enableDefaultSensors?: boolean,
|};

function noop() {}

function getItems() {
  return Array.from(
    { length: 3 },
    (v, k): Item => ({
      id: `${k}`,
      isEnabled: true,
    }),
  );
}

export default function App(props: Props) {
  const onDragStart = props.onDragStart || noop;
  const onDragEnd = props.onDragStart || noop;
  const sensors: Sensor[] = props.sensors || [];
  const [items] = useState(() => props.items || getItems());

  return (
    <DragDropContext
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      __unstableSensors={sensors}
      enableDefaultSensors={props.enableDefaultSensors}
    >
      <Droppable droppableId="droppable">
        {(droppableProvided: DroppableProvided) => (
          <div
            {...droppableProvided.droppableProps}
            ref={droppableProvided.innerRef}
          >
            {items.map((item: Item, index: number) => (
              <Draggable
                key={item.id}
                draggableId={item.id}
                index={index}
                isDragDisabled={!item.isEnabled}
              >
                {(
                  provided: DraggableProvided,
                  snapshot: DraggableStateSnapshot,
                ) => (
                  <div
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    data-is-dragging={snapshot.isDragging}
                    data-is-drop-animating={snapshot.isDropAnimating}
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
      {props.anotherChild || null}
    </DragDropContext>
  );
}
