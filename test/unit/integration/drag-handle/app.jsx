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

export type RenderItem = (
  item: Item,
) => (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => Node;

export const defaultItemRender: RenderItem = (item: Item) => (
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

  // droppable
  direction?: Direction,
  isCombineEnabled?: boolean,

  sensors?: Sensor[],
  enableDefaultSensors?: boolean,
|};

function noop() {}

function getItems() {
  return Array.from({ length: 3 }, (v, k): Item => ({
    id: `${k}`,
  }));
}

function withDefaultBool(value: ?boolean, defaultValue: boolean) {
  if (typeof value === 'boolean') {
    return value;
  }
  return defaultValue;
}

export default function App(props: Props) {
  const onDragStart = props.onDragStart || noop;
  const onDragUpdate = props.onDragUpdate || noop;
  const onDragEnd = props.onDragEnd || noop;
  const sensors: Sensor[] = props.sensors || [];
  const [items] = useState(() => props.items || getItems());
  const render = props.renderItem || defaultItemRender;
  const direction: Direction = props.direction || 'vertical';
  const isCombineEnabled: boolean = withDefaultBool(
    props.isCombineEnabled,
    false,
  );

  return (
    <DragDropContext
      onDragStart={onDragStart}
      onDragUpdate={onDragUpdate}
      onDragEnd={onDragEnd}
      sensors={sensors}
      enableDefaultSensors={props.enableDefaultSensors}
    >
      <Droppable
        droppableId="droppable"
        direction={direction}
        isCombineEnabled={isCombineEnabled}
      >
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
                disableInteractiveElementBlocking={withDefaultBool(
                  item.canDragInteractiveElements,
                  false,
                )}
                shouldRespectForcePress={withDefaultBool(
                  item.shouldRespectForcePress,
                  false,
                )}
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
