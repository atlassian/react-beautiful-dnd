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
  type Direction,
} from '../../../../src';

export type Item = {|
  id: string,
  // defaults to true
  isEnabled?: boolean,
  // defaults to false
  canDragInteractiveElements?: boolean,
  // defaults to false
  shouldRespectForcePress?: boolean,
|};

type RenderItem = (
  item: Item,
) => (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => Node;

const defaultItemRender: RenderItem = (item: Item) => (
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
);

type Props = {|
  onDragStart?: Function,
  onDragUpdate?: Function,
  onDragEnd?: Function,
  items?: Item[],
  anotherChild?: Node,
  renderItem?: RenderItem,
  direction?: Direction,

  sensors?: Sensor[],
  enableDefaultSensors?: boolean,
|};

function noop() {}

function getItems() {
  return Array.from(
    { length: 3 },
    (v, k): Item => ({
      id: `${k}`,
    }),
  );
}

export default function App(props: Props) {
  const onDragStart = props.onDragStart || noop;
  const onDragUpdate = props.onDragUpdate || noop;
  const onDragEnd = props.onDragEnd || noop;
  const sensors: Sensor[] = props.sensors || [];
  const [items] = useState(() => props.items || getItems());
  const render = props.renderItem || defaultItemRender;
  const direction: Direction = props.direction || 'vertical';

  return (
    <DragDropContext
      onDragStart={onDragStart}
      onDragUpdate={onDragUpdate}
      onDragEnd={onDragEnd}
      sensors={sensors}
      enableDefaultSensors={props.enableDefaultSensors}
    >
      <Droppable droppableId="droppable" direction={direction}>
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
                isDragDisabled={item.isEnabled === false}
                disableInteractiveElementBlocking={
                  typeof item.canDragInteractiveElements === 'boolean'
                    ? item.canDragInteractiveElements
                    : false
                }
                shouldRespectForcePress={
                  typeof item.shouldRespectForcePress === 'boolean'
                    ? item.shouldRespectForcePress
                    : false
                }
              >
                {render(item)}
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
