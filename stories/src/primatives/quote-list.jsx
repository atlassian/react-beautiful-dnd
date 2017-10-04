// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { Droppable, Draggable } from '../../../src';
import QuoteItem from '../primatives/quote-item';
import { grid, colors } from '../constants';
import Title from '../primatives/title';
import type { Quote } from '../types';
import type {
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot,
} from '../../../src/';

const Wrapper = styled.div`
  background-color: ${({ isDraggingOver }) => (isDraggingOver ? colors.blue.lighter : colors.blue.light)};
  display: flex;
  flex-direction: column;
  opacity: ${({ isDropDisabled }) => (isDropDisabled ? 0.5 : 'inherit')};
  padding: ${grid}px;
  padding-bottom: 0;
  transition: background-color 0.1s ease, opacity 0.1s ease;
  user-select: none;
  width: 250px;
`;

const DropZone = styled.div`
  /* stop the list collapsing when empty */
  min-height: 250px;
  /* not relying on the items for a margin-bottom
  as it will collapse when the list is empty */
  margin-bottom: ${grid}px;
`;

const ScrollContainer = styled.div`
  overflow: auto;
  max-height: 300px;
`;

const Container = styled.div``;

export default class QuoteList extends Component {
  props: {|
    listId: string,
    quotes: Quote[],
    title?: string,
    listType?: string,
    internalScroll?: boolean,
    isDropDisabled ?: boolean,
    style?: Object,
    // may not be provided - and might be null
    autoFocusQuoteId?: ?string,
  |}

  renderQuotes = (dropProvided: DroppableProvided) => {
    const { listType, quotes } = this.props;
    const title = this.props.title ? (
      <Title>{this.props.title}</Title>
    ) : null;

    return (
      <Container>
        {title}
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
                    autoFocus={this.props.autoFocusQuoteId === quote.id}
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
    const { listId, listType, internalScroll, isDropDisabled, style } = this.props;

    return (
      <Droppable droppableId={listId} isDropDisabled={isDropDisabled} type={listType}>
        {(dropProvided: DroppableProvided, dropSnapshot: DroppableStateSnapshot) => (
          <Wrapper
            style={style}
            isDraggingOver={dropSnapshot.isDraggingOver}
            isDropDisabled={isDropDisabled}
          >
            {internalScroll ? (
              <ScrollContainer>
                {this.renderQuotes(dropProvided)}
              </ScrollContainer>
            ) : (
              this.renderQuotes(dropProvided)
            )}
          </Wrapper>
        )}
      </Droppable>
    );
  }
}
