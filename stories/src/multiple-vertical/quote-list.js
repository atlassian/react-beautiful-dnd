// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { Droppable, Draggable } from '../../../src';
import QuoteItem from '../primatives/quote-item';
import { grid, colors } from '../constants';
import type { Quote } from '../types';
import type {
  Provided as DroppableProvided,
  StateSnapshot as DroppableStateSnapshot,
} from '../../../src/view/droppable/droppable-types';
import type {
  Provided as DraggableProvided,
  StateSnapshot as DraggableStateSnapshot,
} from '../../../src/view/draggable/draggable-types';

const Wrapper = styled.div`
  width: 250px;
  background-color: ${({ isDraggingOver }) => (isDraggingOver ? colors.blue.lighter : colors.blue.light)};
  display: flex;
  flex-direction: column;
  padding: ${grid}px;
  padding-bottom: 0;
  user-select: none;
  transition: background-color 0.1s ease;
`;

const DropZone = styled.div`
  /* stop the list collapsing when empty */
  min-height: 150px;
`;

const ScrollContainer = styled.div`
  overflow: auto;
  max-height: 400px;
`;

const Container = styled.div`
  /* flex child */
  flex-grow: 1;

  /* flex parent */
  display: flex;
  flex-direction: column;
`;

const Title = styled.h4`
  margin-bottom: ${grid}px;
`;

export default class QuoteList extends Component {
  props: {|
    listId: string,
    quotes: Quote[],
    listType?: string,
    style?: Object,
    internalScroll?: boolean,
  |}

  renderBoard = (dropProvided) => {
    const { listId, listType, quotes } = this.props;

    return (
      <Container>
        <Title>{listId}</Title>
        <DropZone innerRef={dropProvided.innerRef}>
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
        </DropZone>
      </Container>
    );
  }

  render() {
    const { listId, listType, internalScroll, style } = this.props;

    return (
      <Droppable droppableId={listId} type={listType}>
        {(dropProvided: DroppableProvided, dropSnapshot: DroppableStateSnapshot) => (
          <Wrapper
            style={style}
            isDraggingOver={dropSnapshot.isDraggingOver}
          >
            {internalScroll ? (
              <ScrollContainer>
                {this.renderBoard(dropProvided)}
              </ScrollContainer>
            ) : (
              this.renderBoard(dropProvided)
            )}
          </Wrapper>
        )}
      </Droppable>
    );
  }
}
