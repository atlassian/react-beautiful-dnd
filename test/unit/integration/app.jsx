// @flow
import React from 'react';
import { DragDropContext, Droppable, Draggable } from '../../../src';
import type { Provided as DroppableProvided } from '../../../src/view/droppable/droppable-types';
import type { Provided as DraggableProvided } from '../../../src/view/draggable/draggable-types';

export default class App extends React.Component<*, *> {
  onDragStart = () => {
    // drag is starting!
  };

  onDragEnd = () => {
    // drag is ending!
  };

  render() {
    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <Droppable droppableId="drop-1">
          {(provided: DroppableProvided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              <Draggable draggableId="drag-1" index={0}>
                {(dragProvided: DraggableProvided) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                  >
                    Drag me!
                  </div>
                )}
              </Draggable>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}
