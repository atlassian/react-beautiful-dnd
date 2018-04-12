// @flow
import React from 'react';
import styled from 'styled-components';
import { DragDropContext, Droppable } from '../../../../../src';
import Column from './column';
import initial from './data';
import { grid } from '../../../layouts/constants';
import type { DroppableProvided } from '../../../../../src';
import type { Entities, ColumnId, Item, ItemId, Column as ColumnType } from './types';

type State = {|
  entities: Entities,
|}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

export default class Board extends React.Component<*, State> {
  state: State = {
    entities: initial,
  }

  onDragEnd = () => {

  }

  render() {
    const entities: Entities = this.state.entities;
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="board" type="column" direction="horizontal">
          {(provided: DroppableProvided) => (
            <Container
              innerRef={provided.innerRef}
              {...provided.droppableProps}
            >
              {entities.columnOrder.map((columnId: ColumnId, index: number) => {
                const column: ColumnType = entities.columns[columnId];
                // Get the items for this column
                const items: Item[] = column.itemIds.map(
                  (itemId: ItemId): Item => entities.items[itemId]
                );
                return (
                  <Column
                    key={column.id}
                    column={entities.columns[columnId]}
                    items={items}
                    index={index}
                  />
                );
              })}
              {provided.placeholder}
            </Container>
          )}

        </Droppable>
      </DragDropContext>
    );
  }
}
