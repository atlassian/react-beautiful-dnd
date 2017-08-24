// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { Droppable, Draggable } from '../../../src';
import QuoteItem from '../primatives/quote-item';
import { grid, colors } from '../constants';
import type { Quote } from '../types';
import type { NestedQuoteList } from './types';
import type {
  Provided as DroppableProvided,
  StateSnapshot as DroppableSnapshot,
} from '../../../src/view/droppable/droppable-types';
import type {
  Provided as DraggableProvided,
  StateSnapshot as DraggableStateSnapshot,
} from '../../../src/view/draggable/draggable-types';

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
`;

const NestedContainer = Container.extend`
  padding: 0;
  margin-bottom: ${grid}px;
  &:hover {
    cursor: grab;
  }
`;

const Title = styled.h4`
  margin-bottom: ${grid}px;
`;

export default class QuoteList extends Component {
  props: {|
    list: NestedQuoteList
  |}

  renderQuote = (quote: Quote, type: string) => (
    <Draggable
      key={quote.id}
      draggableId={quote.id}
      type={type}
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
      {(dropProvided: DroppableProvided, dropSnapshot: DroppableSnapshot) => (
        <Container
          innerRef={dropProvided.innerRef}
          isDraggingOver={dropSnapshot.isDraggingOver}
        >
          <Title>{list.title}</Title>
          {list.children.map((item: Quote | NestedQuoteList) => (
            !item.children ?
              this.renderQuote((item: any), list.id) :
              (
                <Draggable draggableId={item.id} type={list.id} key={item.id}>
                  {(dragProvided: DraggableProvided, dragSnapshot: DraggableStateSnapshot) => (
                    <div>
                      <NestedContainer
                        innerRef={dragProvided.innerRef}
                        isDragging={dragSnapshot.isDragging}
                        style={dragProvided.draggableStyle}
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
