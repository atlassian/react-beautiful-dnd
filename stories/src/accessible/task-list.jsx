// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { Droppable } from '../../../src/';
import Task from './task';
import type { DroppableProvided, DroppableStateSnapshot } from '../../../src/';
import type { Task as TaskType } from './types';

type Props = {|
  tasks: TaskType[],
|}

const Container = styled.div`
  background: lightgreen;
  width: 400px;
`;

export default class TaskList extends Component<Props> {
  render() {
    return (
      <Droppable droppableId="list">
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
          <Container
            innerRef={provided.innerRef}
            {...provided.droppableProps}
          >
            {this.props.tasks.map((task: TaskType, index: number) => (
              <Task
                key={task.id}
                task={task}
                index={index}
              />
            ))}
            {provided.placeholder}
          </Container>
        )}
      </Droppable>
    );
  }
}
