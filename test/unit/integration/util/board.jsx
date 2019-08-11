// @flow
import React from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DroppableProvided,
  type DraggableProvided,
  type DraggableStateSnapshot,
} from '../../../../src';
import { noop } from '../../../../src/empty';

type CardProps = {|
  index: number,
  cardId: string,
|};
function Card(props: CardProps) {
  return (
    <Draggable draggableId={props.cardId} index={props.index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          data-testid={props.cardId}
          data-is-dragging={snapshot.isDragging}
        />
      )}
    </Draggable>
  );
}

type ColumnProps = {|
  index: number,
  columnId: string,
|};

function Column(props: ColumnProps) {
  return (
    <Draggable draggableId={props.columnId} index={props.index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          data-testid={props.columnId}
          data-is-dragging={snapshot.isDragging}
        >
          <Droppable droppableId={props.columnId} type="ITEM">
            {(droppableProvided: DroppableProvided) => (
              <div
                {...droppableProvided.droppableProps}
                ref={droppableProvided.innerRef}
              >
                <Card cardId="card-0" index={0} />
                {droppableProvided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
}

export default function Board() {
  return (
    <DragDropContext onDragEnd={noop}>
      <Droppable droppableId="BOARD" type="BOARD">
        {(provided: DroppableProvided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            <Column columnId="column-0" index={0} />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
