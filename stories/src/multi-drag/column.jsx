// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import memoizeOne from 'memoize-one';
import { Droppable } from '../../../src/';
import { grid, colors, borderRadius } from '../constants';
import Task from './task';
import type { DroppableProvided, DroppableStateSnapshot } from '../../../src/';
import type { Column as ColumnType } from './types';
import type { Task as TaskType, Id } from '../types';

type Props = {|
  column: ColumnType,
  tasks: TaskType[],
  selectedTaskIds: Id[],
  multiSelectTo: (taskId: Id) => void,
  isSomethingDragging: boolean,
  toggleSelection: (taskId: Id) => void,
  toggleSelectionInGroup: (taskId: Id) => void,
  multiSelectTo: (taskId: Id) => void,
|}

const Container = styled.div`
  width: 300px;
  margin: ${grid}px;
  background-color: ${colors.grey};
  border-radius: ${borderRadius}px;

  /* we want the column to take up its full height */
  display: flex;
  flex-direction: column;
`;

const Title = styled.h3`
  font-weight: bold;
  padding: ${grid}px;
`;

const TaskList = styled.div`
  padding: ${grid}px;
  min-height: 200px;
  flex-grow: 1;
  ${props => (props.isDraggingOver ? `background-color: ${colors.green}` : '')};
`;

type TaskIdMap = {
  [taskId: Id]: true,
}

const getSelectedMap = memoizeOne((selectedTaskIds: Id[]) =>
  selectedTaskIds.reduce((previous: TaskIdMap, current: Id): TaskIdMap => {
    previous[current] = true;
    return previous;
  }, {}));

export default class Column extends Component<Props> {
  render() {
    const column: ColumnType = this.props.column;
    const tasks: TaskType[] = this.props.tasks;
    const selectedTaskIds: Id[] = this.props.selectedTaskIds;
    const isSomethingDragging: boolean = this.props.isSomethingDragging;
    return (
      <Container>
        <Title>{column.title}</Title>
        <Droppable droppableId={column.id}>
          {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
            <TaskList
              innerRef={provided.innerRef}
              isDraggingOver={snapshot.isDraggingOver}
              {...provided.droppableProps}
            >
              {tasks.map((task: TaskType, index: number) => (
                <Task
                  task={task}
                  index={index}
                  key={task.id}
                  isSelected={Boolean(getSelectedMap(selectedTaskIds)[task.id])}
                  isGhosting={getSelectedMap(selectedTaskIds)[task.id] && isSomethingDragging}
                  selectionCount={selectedTaskIds.length}
                  toggleSelection={this.props.toggleSelection}
                  toggleSelectionInGroup={this.props.toggleSelectionInGroup}
                  multiSelectTo={this.props.multiSelectTo}
                />
              ))}
              {provided.placeholder}
            </TaskList>
          )}
        </Droppable>
      </Container>
    );
  }
}
