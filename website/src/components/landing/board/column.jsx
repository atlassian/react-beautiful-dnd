// @flow
import React from 'react';
import styled from 'styled-components';
import { colors } from '@atlaskit/theme';
import { Draggable, Droppable } from '../../../../../src';
import Item from './item';
import { grid } from '../../../layouts/constants';
import type { DroppableProvided, DraggableProvided, DroppableStateSnapshot } from '../../../../../src';
import type {
  Entities,
  ColumnId,
  ItemId,
  Item as ItemType,
  Column as ColumnType,
} from './types';

type InnerListProps = {|
  items: ItemType[],
|}

// A performance optimisation to avoid rendering all the children
// when dragging over a list
class InnerList extends React.Component<InnerListProps> {
  shouldComponentUpdate(nextProps: InnerListProps) {
    // items have not changed
    // TODO: check that this is not broken by the map function above
    if (this.props.items === nextProps.items) {
      return false;
    }
    return true;
  }

  render() {
    return this.props.items.map((item: ItemType, index: number) => (
      <Item key={item.id} item={item} index={index} />
    ));
  }
}

const Container = styled.div`
  background-color: ${colors.N30};
  margin: ${grid}px;
  color: ${colors.N800};
  border-radius: 2px;
  font-weight: bold;
  user-select: none;
  width: 270px;
`;

const Header = styled.div`
  font-size: 20px;
  padding: ${grid}px;
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;

  &:hover {
    background-color: ${colors.G50};
  }
`;

const List = styled.div`
  min-height: 100px;
  padding: ${grid}px;

  ${props => (props.isDraggingOver ? `
    background-color: green;
  ` : '')}
`;

type Props = {|
  column: ColumnType,
  items: ItemType[],
  index: number,
|}

export default class Column extends React.Component<Props> {
  render() {
    const column: ColumnType = this.props.column;
    const index: number = this.props.index;
    const items: ItemType[] = this.props.items;

    return (
      <Draggable draggableId={column.id} index={index}>
        {(draggableProvided: DraggableProvided) => (
          <Container
            innerRef={draggableProvided.innerRef}
            {...draggableProvided.draggableProps}
          >
            {/* Making the column draggable from the column */}
            <Header {...draggableProvided.dragHandleProps}>
              {column.title}
            </Header>
            <Droppable droppableId={column.id} type="item">
              {(droppableProvided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                <List
                  innerRef={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                  isDraggingOver={snapshot.isDraggingOver}
                >
                  <InnerList items={items} />
                  {droppableProvided.placeholder}
                </List>
              )}
            </Droppable>
          </Container>
          )}
      </Draggable>
    );
  }
}
