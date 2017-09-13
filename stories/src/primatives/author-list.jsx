// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { Droppable, Draggable } from '../../../src';
import Author from '../primatives/author-item';
import { grid, colors } from '../constants';
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
  padding: ${grid}px;
  user-select: none;
  transition: background-color 0.1s ease;
  margin: ${grid}px 0;

  overflow: auto;
`;

const DropZone = styled.div`
  /* stop the list collapsing when empty */
  min-width: 600px;
  display: flex;
`;

const ScrollContainer = styled.div`
  overflow: auto;
`;

const Container = styled.div`
  /* flex child */
  flex-grow: 1;

  /* flex parent */
  display: flex;
  flex-direction: column;
`;

export default class AuthorList extends Component {
  props: {|
    quotes: Quote[],
    listType?: string,
    style?: Object,
    internalScroll?: boolean,
  |}

  renderBoard = (dropProvided: DroppableProvided) => {
    const { listType, quotes } = this.props;

    return (
      <Container>
        <DropZone innerRef={dropProvided.innerRef}>
          {quotes.map((quote: Quote) => (
            <Draggable key={quote.id} draggableId={quote.id} type={listType}>
              {(dragProvided: DraggableProvided, dragSnapshot: DraggableStateSnapshot) => (
                <div>
                  <Author
                    author={quote.author}
                    provided={dragProvided}
                    snapshot={dragSnapshot}
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
      <Droppable droppableId={listId} type={listType} direction="horizontal">
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
