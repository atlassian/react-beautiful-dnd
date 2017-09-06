// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { Droppable } from '../../../src/';
import type { DroppableProvided, DroppableStateSnapshot } from '../../../src/';
import type { Overflow } from './types';

const Container = styled.div`
  display: flex;
  overflow: ${({ overflow }) => overflow};
`;

export default class AuthorList extends Component {
  props: {|
    listId: string,
    overflow?: Overflow,
    children?: any,
  |}

  static defaultProps = {
    overflow: 'visible',
  }

  render() {
    return (
      <Droppable
        droppableId={this.props.listId}
        direction="horizontal"
      >
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
          <Container
            isDraggingOver={snapshot.isDraggingOver}
            overflow={this.props.overflow}
            innerRef={provided.innerRef}
          >
            {this.props.children}
            {provided.placeholder}
          </Container>
        )}
      </Droppable>
    );
  }
}
