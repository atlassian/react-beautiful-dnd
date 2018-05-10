// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { Draggable } from '../../../src/';
import type { DraggableProvided, DraggableStateSnapshot } from '../../../src/';
import type { Task as TaskType } from '../types';
import { colors, grid, borderRadius } from '../constants';

type Props = {|
  task: TaskType,
  index: number,
|}

const Container = styled.div`
  border-bottom: 1px solid #ccc;
  background: ${colors.white};
  padding: ${grid}px;
  margin-bottom: ${grid}px;
  border-radius: ${borderRadius}px;
  font-size: 18px;
  ${({ isDragging }) => (isDragging ? 'box-shadow: 1px 1px 1px grey; background: lightblue' : '')}
`;

export default class Task extends Component<Props> {
  render() {
    const task: TaskType = this.props.task;
    const index: number = this.props.index;

    return (
      <Draggable draggableId={task.id} index={index}>
        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
          <Container
            innerRef={provided.innerRef}
            isDragging={snapshot.isDragging}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            aria-roledescription="Draggable task. Press space bar to lift"
          >
            {this.props.task.content}
          </Container>
        )}
      </Draggable>
    );
  }
}
