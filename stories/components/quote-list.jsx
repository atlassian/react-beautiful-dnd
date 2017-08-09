// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import Droppable from '../../src/view/droppable/connected-droppable';
import { borderRadius, grid } from './constants';
import type { Provided, StateSnapshot } from '../../src/view/droppable/droppable-types';

const Container = styled.div`
  background-color: ${({ isDraggingOver }) => (isDraggingOver ? '#d9fcff' : 'lightblue')};
  border-radius: ${borderRadius}px;
  display: flex;
  flex-direction: column;
  padding: ${grid}px;
  padding-bottom: 0;
  user-select: none;
  transition: background-color 0.1s ease;
  width: 250px;
`;

export default class List extends Component {
  props: {|
    listId: string,
    children ?: any,
    style?: Object,
  |}

  render() {
    return (
      <Droppable droppableId={this.props.listId}>
        {(provided: Provided, snapshot: StateSnapshot) => (
          <Container
            isDraggingOver={snapshot.isDraggingOver}
            innerRef={provided.innerRef}
            style={this.props.style}
          >
            {this.props.children}
          </Container>
        )}
      </Droppable>
    );
  }
}
