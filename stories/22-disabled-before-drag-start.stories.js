// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DraggableProvided,
  type DraggableStateSnapshot,
  type DroppableProvided,
  type DroppableStateSnapshot,
} from '../src';

const grid: number = 8;

const getListStyle = isDraggingOver => ({
  background: isDraggingOver ? 'lightblue' : 'lightgrey',
  padding: grid,
  overflow: 'auto',
});

const getItemStyle = (isDragging, draggableStyle, draggable) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: 'none',
  padding: grid * 2,
  margin: `0 ${grid}px 0 0`,

  // change background colour if dragging
  /* eslint-disable no-nested-ternary */
  background: draggable === false ? 'red' : isDragging ? 'lightgreen' : 'grey',

  // styles we need to apply on draggables
  ...draggableStyle,
});

const getItems = (count: number): Item[] =>
  Array.from({ length: count }, (v, k) => k).map(k => ({
    id: `item-${k}`,
    content: `item ${k}`,
  }));

type State = {|
  items: Item[],
  draggable: Boolean,
  draggableId: String,
|};

class App extends React.Component<*, State> {
  state: State = {
    items: getItems(6),
    draggable: true,
    draggableId: undefined,
  };

  shouldDragStart = (draggableId: string): Boolean => {
    const id: number = Number(draggableId.split('-')[1]);
    const randNum = Math.floor(Math.random() * 10);
    const draggable = randNum % 2 === 0;
    this.setState({ draggable, draggableId });
    return draggable;
  }

  render() {
    return (
      <DragDropContext shouldDragStart={this.shouldDragStart}>
        <div style={{ marginTop: grid * 2 }}>
          Try to drag item and you will find some items could not be dragged.
          It`s random process =D.
        </div>
        <Droppable droppableId="droppable">
          {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
            <div
              ref={provided.innerRef}
              style={getListStyle(snapshot.isDraggingOver)}
              {...provided.droppableProps}
            >
              {this.state.items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(
                    draggableProvided: DraggableProvided,
                    draggableSnapshot: DraggableStateSnapshot,
                  ) => (
                    <div
                      ref={draggableProvided.innerRef}
                      {...draggableProvided.draggableProps}
                      {...draggableProvided.dragHandleProps}
                      style={getItemStyle(
                        draggableSnapshot.isDragging,
                        draggableProvided.draggableProps.style,
                        this.state.draggableId === item.id
                          ? this.state.draggable
                          : undefined,
                      )}
                    >
                      {item.content}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}

storiesOf('onDragStart', module).add(
  'disable dragging by shouldDragStart',
  () => <App />,
);
