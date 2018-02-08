// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { Draggable } from '../../../src/';
import type { DraggableProvided, DraggableStateSnapshot } from '../../../src/';
import type { Task as TaskType } from './types';
import { grid, borderRadius } from '../constants';

type Props = {|
  task: TaskType,
  index: number,
|}

const Container = styled.div`
  background: lightblue;
  padding: ${grid}px;
  margin-bottom: ${grid}px;
  border-radius: ${borderRadius}px;
  font-size: 24px;
`;

const Wrapper = styled.div``;

export default class Task extends Component<Props> {
  render() {
    const task: TaskType = this.props.task;
    const index: number = this.props.index;

    return (
      <Draggable draggableId={task.id} index={index}>
        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
          <Wrapper>
            <Container
              innerRef={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
            >
              {this.props.task.content}
            </Container>
            {provided.placeholder}
          </Wrapper>
        )}
      </Draggable>
    );
  }
}
