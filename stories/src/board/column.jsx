// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { grid, colors, borderRadius } from '../constants';
import { Draggable } from '../../../src/';
import CardList from '../vertical/quote-list';
import type { AuthorWithQuotes } from '../types';
import type { Provided, StateSnapshot } from '../../../src/view/draggable/draggable-types';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Container = styled.div`
  margin: ${grid}px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-top-left-radius: ${borderRadius}px;
  border-top-right-radius: ${borderRadius}px;
  background-color: ${({ isDragging }) => (isDragging ? colors.blue.lighter : colors.blue.light)};
  transition: background-color 0.1s ease;

  &:hover {
    background-color: ${colors.blue.lighter};
  }
`;

const Title = styled.h4`
  padding: ${grid}px;
  cursor: grab;
  transition: background-color ease 0.2s;
  flex-grow: 1;
  user-select: none;
`;

export default class Column extends Component {
  props: {|
    column: AuthorWithQuotes
  |}
  render() {
    const column: AuthorWithQuotes = this.props.column;
    return (
      <Draggable draggableId={column.author.id} type="AUTHOR">
        {(provided: Provided, snapshot: StateSnapshot) => (
          <Wrapper>
            <Container
              innerRef={provided.innerRef}
              style={provided.draggableStyle}
            >
              <Header isDragging={snapshot.isDragging}>
                <Title
                  isDragging={snapshot.isDragging}
                  {...provided.dragHandleProps}
                >
                  {column.author.name}
                </Title>
              </Header>
              <CardList
                listId={column.author.id}
                listType={column.author.id}
                quotes={column.quotes}
              />
            </Container>
            {provided.placeholder}
          </Wrapper>
        )}

      </Draggable>
    );
  }
}
