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
  overflow-x: hidden;
  overflow-y: auto;
  max-height: 300px;
`;

const Container = styled.div``;

type Props = {|
  listId: string,
  quotes: Quote[],
  title?: string,
  listType?: string,
  internalScroll?: boolean,
  isDropDisabled ?: boolean,
  style?: Object,
  // may not be provided - and might be null
  autoFocusQuoteId?: ?string,
  ignoreContainerClipping?: boolean,
|}

export default class QuoteList extends Component<Props> {
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
    const {
      ignoreContainerClipping,
      internalScroll,
      isDropDisabled,
      listId,
      listType,
      style,
    } = this.props;

    return (
      <Droppable
        droppableId={listId}
        ignoreContainerClipping={ignoreContainerClipping}
        isDropDisabled={isDropDisabled}
        type={listType}
      >
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
