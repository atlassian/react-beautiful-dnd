// @flow
import React from 'react';
import styled from 'styled-components';
import { DragDropContext, Droppable } from '../../../../../src';
import Column from './column';
import initial from './entities';
import reorder from '../../reorder';
import type {
  DroppableProvided,
  DropResult,
  DraggableLocation,
} from '../../../../../src';
import type { Entities, Column as ColumnType, ColumnMap } from './board-types';
import type { Id, Quote } from '../../types';

type State = {|
  entities: Entities,
|};

type Props = {|
  numberOfColumns: 1 | 2,
|};

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const withQuotes = (column: ColumnType, quoteIds: Id[]): ColumnType => {
  const updated: ColumnType = {
    id: column.id,
    title: column.title,
    quoteIds,
  };
  return updated;
};

export default class Board extends React.Component<Props, State> {
  static defaultProps = {
    numberOfColumns: 2,
  };

  state: State = {
    entities: initial,
  };

  onDragEnd = (result: DropResult) => {
    // dropped nowhere
    if (!result.destination) {
      return;
    }

    const source: DraggableLocation = result.source;
    const destination: DraggableLocation = result.destination;

    // did not move anywhere - can bail early
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const entities: Entities = this.state.entities;

    // reordering column
    if (result.type === 'column') {
      const reordered: Id[] = reorder(
        entities.columnOrder,
        source.index,
        destination.index,
      );
      const updated: Entities = {
        columnOrder: reordered,
        quotes: entities.quotes,
        columns: entities.columns,
      };
      this.setState({ entities: updated });
      return;
    }

    // moving quote

    const start: ColumnType = entities.columns[source.droppableId];
    const end: ColumnType = entities.columns[destination.droppableId];

    // moving in same list
    if (start === end) {
      const reordered: Id[] = reorder(
        start.quoteIds,
        source.index,
        destination.index,
      );
      const newColumnMap: ColumnMap = {
        ...entities.columns,
        [start.id]: withQuotes(start, reordered),
      };
      const updated: Entities = {
        columnOrder: entities.columnOrder,
        quotes: entities.quotes,
        columns: newColumnMap,
      };
      this.setState({ entities: updated });
      return;
    }

    // moving into different list

    // remove quote from original
    const removedFrom: Id[] = [...start.quoteIds];
    removedFrom.splice(source.index, 1);
    // add quote to new list
    const addedTo: Id[] = [...end.quoteIds];
    addedTo.splice(destination.index, 0, result.draggableId);

    const newColumnMap: ColumnMap = {
      ...entities.columns,
      [start.id]: withQuotes(start, removedFrom),
      [end.id]: withQuotes(end, addedTo),
    };
    const updated: Entities = {
      columnOrder: entities.columnOrder,
      quotes: entities.quotes,
      columns: newColumnMap,
    };
    this.setState({ entities: updated });
  };

  render() {
    const entities: Entities = this.state.entities;
    const numberOfColumns: number = this.props.numberOfColumns;

    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="board" type="column" direction="horizontal">
          {(provided: DroppableProvided) => (
            <Container
              innerRef={provided.innerRef}
              {...provided.droppableProps}
            >
              {entities.columnOrder
                .slice(0, numberOfColumns)
                .map((columnId: Id, index: number) => {
                  const column: ColumnType = entities.columns[columnId];
                  // Get the items for this column
                  const quotes: Quote[] = column.quoteIds.map(
                    (quoteId: Id): Quote => entities.quotes[quoteId],
                  );
                  return (
                    <Column
                      key={column.id}
                      column={entities.columns[columnId]}
                      quotes={quotes}
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
