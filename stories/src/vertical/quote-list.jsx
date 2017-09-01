// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import QuoteItem from '../primatives/quote-item';
import { grid, colors } from '../constants';
import { Droppable, Draggable } from '../../../src';
import type {
  DraggableProvided,
  DraggableStateSnapshot,
  DroppableProvided,
  DroppableStateSnapshot,
} from '../../../src/';
import type { Quote } from '../types';

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
          </Container>
        )}
      </Droppable>
    );
  }
}
