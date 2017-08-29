// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { Droppable, Draggable } from '../../../src';
import QuoteItem from '../primatives/quote-item';
import { borderRadius, grid, colors } from '../constants';
import type { Quote } from '../types';
import type {
  Provided as DroppableProvided,
  StateSnapshot as DroppableStateSnapshot,
} from '../../../src/view/droppable/droppable-types';
import type {
  Provided as DraggableProvided,
  StateSnapshot as DraggableStateSnapshot,
} from '../../../src/view/draggable/draggable-types';

const Container = styled.div`
  background-color: ${({ isDraggingOver }) => (isDraggingOver ? colors.blue.lighter : colors.blue.light)};
  display: flex;
  flex-direction: column;
  padding: ${grid}px;
  padding-bottom: 0;
  user-select: none;
  transition: background-color 0.1s ease;
  width: 250px;
`;

const AddCard = styled.button`
  margin-bottom: ${grid}px;
  margin-top: ${grid}px;
  outline: none;
  border: none;
  font-size: 14px;
  text-align: left;
  padding: ${grid * 1.5}px ${grid}px;
`;

export default class QuoteList extends Component {
  props: {|
    listId: string,
    quotes: Quote[],
    listType?: string,
    style?: Object,
  |}

  render() {
    const { listId, listType, style, quotes } = this.props;
    return (
      <Droppable droppableId={listId} type={listType}>
        {(dropProvided: DroppableProvided, dropSnapshot: DroppableStateSnapshot) => (
          <Container
            isDraggingOver={dropSnapshot.isDraggingOver}
            innerRef={dropProvided.innerRef}
            style={style}
          >
            {quotes.map((quote: Quote) => (
              <Draggable key={quote.id} draggableId={quote.id} type={listType}>
                {(dragProvided: DraggableProvided, dragSnapshot: DraggableStateSnapshot) => (
                  <div>
                    <QuoteItem
                      key={quote.id}
                      quote={quote}
                      isDragging={dragSnapshot.isDragging}
                      provided={dragProvided}
                    />
                    {dragProvided.placeholder}
                  </div>
                )}
              </Draggable>
            ))}
            {dropProvided.placeholder}
            <AddCard>
              Add a card...
            </AddCard>
          </Container>
        )}
      </Droppable>
    );
  }
}
