// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { Droppable, Draggable } from '../../../src';
import QuoteItem from '../primatives/quote-item';
import Title from '../primatives/title';
import { grid, colors } from '../constants';
import type { Quote } from '../types';
import type { NestedQuoteList } from './types';
import type {
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot,
} from '../../../src/';

const Root = styled.div`
  width: 250px;
`;

const Container = styled.div`
  background-color: ${({ isDraggingOver }) => (isDraggingOver ? colors.blue.lighter : colors.blue.light)};
  display: flex;
  flex-direction: column;
  padding: ${grid}px;
  padding-bottom: 0;
  user-select: none;
  transition: background-color 0.1s ease;
  &:focus {
    outline: 2px solid ${colors.purple};
    outline-offset: 2px;
  }
`;

const NestedContainer = Container.extend`
  padding: 0;
  margin-bottom: ${grid}px;
  &:hover {
    cursor: grab;
  }
`;

export default class QuoteList extends Component<{ list: NestedQuoteList }> {
  renderQuote = (quote: Quote, type: string, index: number) => (
    <Draggable
      key={quote.id}
      draggableId={quote.id}
      type={type}
      index={index}
    >
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div>
          <QuoteItem
            quote={quote}
            isDragging={snapshot.isDragging}
            provided={provided}
          />
          {provided.placeholder}
        </div>
      )}
    </Draggable>
  )

  renderList = (list: NestedQuoteList, level?: number = 0) => (
    <Droppable
      droppableId={list.id}
      type={list.id}
      key={list.id}
    >
      {(dropProvided: DroppableProvided, dropSnapshot: DroppableStateSnapshot) => (
        <Container
          innerRef={dropProvided.innerRef}
          isDraggingOver={dropSnapshot.isDraggingOver}
          {...dropProvided.droppableProps}
        >
          <Title>{list.title}</Title>
          {list.children.map((item: Quote | NestedQuoteList, index: number) => (
            !item.children ?
              this.renderQuote((item: any), list.id, index) :
              (
                <Draggable
                  draggableId={item.id}
                  type={list.id}
                  key={item.id}
                  index={index}
                >
                  {(dragProvided: DraggableProvided, dragSnapshot: DraggableStateSnapshot) => (
                    <div>
                      <NestedContainer
                        innerRef={dragProvided.innerRef}
                        isDragging={dragSnapshot.isDragging}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                      >
                        {this.renderList((item : any), level + 1)}
                      </NestedContainer>
                      {dragProvided.placeholder}
                    </div>
                  )}
                </Draggable>
              )
            ))}
        </Container>
      )}
    </Droppable>
  )

  render() {
    return (
      <Root>
        {this.renderList(this.props.list)}
      </Root>
    );
  }
}
