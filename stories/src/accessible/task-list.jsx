// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { Droppable } from '../../../src/';
import Task from './task';
import type { DroppableProvided, DroppableStateSnapshot } from '../../../src/';
import type { Task as TaskType } from '../types';
import { colors, grid, borderRadius } from '../constants';

type Props = {|
  tasks: TaskType[],
  title: string,
|}

const Container = styled.div`
  width: 300px;
  background-color: ${colors.grey};
  border-radius: ${borderRadius}px;
`;

const Title = styled.h3`
  font-weight: bold;
  padding: ${grid}px;
`;

const List = styled.div`
  padding: ${grid}px;
  padding-bottom: 0px;
  display: flex;
  flex-direction: column;
`;

export default class TaskList extends Component<Props> {
  render() {
    return (
      <Droppable droppableId="list">
        {(provided: DroppableProvided) => (
          <Container
            innerRef={provided.innerRef}
            {...provided.droppableProps}
          >
            <Title>{this.props.title}</Title>
            <List>
              {this.props.tasks.map((task: TaskType, index: number) => (
                <Task
                  key={task.id}
                  task={task}
                  index={index}
                />
              ))}
            </List>
            {provided.placeholder}
          </Container>
        )}
      </Droppable>
    );
  }
}
