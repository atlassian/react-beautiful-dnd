// @flow
import React, { type Node } from 'react';
import styled from 'styled-components';
import { DragDropContext, Droppable, Draggable } from '../../../src/';
import { grid, colors } from '../constants';
import reorder from '../reorder';
import type {
  DropResult,
  DroppableProvided,
  DraggableProvided,
} from '../../../src';

type ItemType = {|
  id: string,
  component: Node,
|}

const initial: ItemType[] = [
  {
    id: 'button',
    component: (
      <button>hello world</button>
    ),
  },
  {
    id: 'select',
    component: (
      <select>
        <option>Option 1</option>
        <option>Option 2</option>
        <option>Option 3</option>
      </select>
    ),
  },
  {
    id: 'textarea',
    component: (
      <textarea placeholder="type some text here" />
    ),
  },
  {
    id: 'input',
    component: (
      <div>
        <input type="text" placeholder="text input" />
      </div>
    ),
  },
  {
    id: 'checkbox',
    component: (
      <label>
        <input type="checkbox" />
      </label>
    )
  },
  {
    id: 'content editable',
    component: (
      <div
        contentEditable
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
            floating text
            <strong>my super cool content</strong>
          `,
        }}
      />
    ),
  },
];

const List = styled.div`
  width: 250px;
  background-color: ${colors.blue.deep};
  padding: ${grid * 2}px;
`;

const Item = styled.div`
  height: 80px;
  background-color: ${colors.white};
  border: 1px solid ${colors.grey};
  padding: ${grid}px;
  margin-bottom: ${grid}px;
`;

const Container = styled.div`
  display: flex;
`;

const Controls = styled.div`
  padding: ${grid * 2}px;
  width: 250px;
`;

const Status = styled.strong`
  color: ${({ isEnabled }) => (isEnabled ? colors.blue.deep : colors.purple)};
`;

type State = {|
  canDragInteractiveElements: boolean,
  items: ItemType[],
|}

export default class InteractiveElementsApp extends React.Component<*, State> {
  state: State = {
    items: initial,
    canDragInteractiveElements: false,
  }

  onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = reorder(
      this.state.items,
      result.source.index,
      result.destination.index
    );

    this.setState({
      items,
    });
  }

  toggleBlocking = () => {
    this.setState({
      canDragInteractiveElements: !this.state.canDragInteractiveElements,
    });
  }

  render() {
    const { canDragInteractiveElements } = this.state;

    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Container>
          <Droppable droppableId="droppable">
            {(droppableProvided: DroppableProvided) => (
              <List
                innerRef={droppableProvided.innerRef}
              >
                {this.state.items.map((item: ItemType, index: number) => (
                  <Draggable
                    key={item.id}
                    draggableId={item.id}
                    disableInteractiveElementBlocking={canDragInteractiveElements}
                    index={index}
                  >
                    {(draggableProvided: DraggableProvided) => (
                      <div>
                        <Item
                          innerRef={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          {...draggableProvided.dragHandleProps}
                        >
                          {item.component}
                        </Item>
                        {draggableProvided.placeholder}
                      </div>
                  )}
                  </Draggable>
              ))}
                {droppableProvided.placeholder}
              </List>
          )}
          </Droppable>
          <Controls>
            <p>
              Dragging from interactive elements is {' '}
              <Status isEnabled={canDragInteractiveElements}>
                {canDragInteractiveElements ? 'enabled' : 'disabled'}
              </Status>
            </p>
            <button onClick={this.toggleBlocking}>toggle</button>
          </Controls>
        </Container>
      </DragDropContext>
    );
  }
}
