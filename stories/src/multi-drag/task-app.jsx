// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { DragDropContext } from '../../../src/';
import initial from './data';
import Column from './column';
import type { Result as ReorderResult } from './utils';
import { reorderBetweenColumns, getHomeColumn } from './utils';
import type { DragStart, DropResult, DraggableLocation } from '../../../src/';
import type { Task, Id } from '../types';
import type { Entities } from './types';

const Container = styled.div`
  display: flex;
  user-select: none;
`;

type State = {|
  entities: Entities,
  selectedTaskIds: Id[],
  // sad times
  isDragging: boolean,
|}

const getTasks = (entities: Entities, columnId: Id): Task[] =>
  entities.columns[columnId].taskIds.map(
    (taskId: Id): Task => entities.tasks[taskId]
  );
export default class TaskApp extends Component<*, State> {
  state: State = {
    entities: initial,
    selectedTaskIds: [],
    isDragging: false,
  }

  componentDidMount() {
    window.addEventListener('click', this.unselectAll);
    window.addEventListener('keydown', this.onWindowKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.unselectAll);
    window.removeEventListener('keydown', this.onWindowKeyDown);
  }

  onDragStart = (start: DragStart) => {
    const id: string = start.draggableId;
    const selected: ?Id = this.state.selectedTaskIds.find((taskId: Id): boolean => taskId === id);

    // if dragging an item that is not selected - unselect all items
    if (!selected) {
      this.unselectAll();
    }
    this.setState({
      isDragging: true,
    });
  }

  onDragEnd = (result: DropResult) => {
    const destination: ?DraggableLocation = result.destination;
    const source: DraggableLocation = result.source;

    // nothing to do
    if (!destination) {
      return;
    }

    const processed: ReorderResult = reorderBetweenColumns({
      entities: this.state.entities,
      selectedTaskIds: this.state.selectedTaskIds,
      source,
      destination,
    });

    this.setState({
      ...processed,
      isDragging: false,
    });
  }

  onWindowKeyDown = (event: KeyboardEvent) => {
    // escape
    if (event.keyCode === 27) {
      console.log('clearing selection in task-app');
      this.unselectAll();
    }
  }

  select = (taskId: Id) => {
    this.setState({
      selectedTaskIds: [taskId],
    });
  }

  addToSelection = (taskId: Id) => {
    this.setState({
      selectedTaskIds: [...this.state.selectedTaskIds, taskId],
    });
  }

  removeFromSelection = (taskId: Id) => {
    const index: number = this.state.selectedTaskIds.indexOf(taskId);

    if (index === -1) {
      throw new Error('Cannot find task in selected list');
    }

    const shallow: Id[] = [...this.state.selectedTaskIds];
    shallow.splice(index, 1);
    this.setState({
      selectedTaskIds: shallow,
    });
  }

  // This behaviour matches the MacOSX finder selection
  multiSelectTo = (taskId: Id) => {
    const selectedTaskIds: Id[] = this.state.selectedTaskIds;
    // Nothing already selected
    if (!selectedTaskIds.length) {
      return;
    }

    // TODO: move to util file
    const columnOfCurrent: Column = getHomeColumn(this.state.entities, taskId);
    const indexOfCurrent: Id = columnOfCurrent.taskIds.indexOf(taskId);

    const lastSelected: Id = selectedTaskIds[selectedTaskIds.length - 1];
    const columnOfLast: Id = getHomeColumn(this.state.entities, lastSelected);

    // multi selecting in the same column
    if (columnOfCurrent === columnOfLast) {

    }

    // multi selecting to another column
  }

  unselect = () => {
    this.unselectAll();
  };

  unselectAll = () => {
    this.setState({
      selectedTaskIds: [],
    });
  }

  render() {
    const entities: Entities = this.state.entities;
    const selected: Id[] = this.state.selectedTaskIds;
    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <Container>
          {entities.columnOrder.map((columnId: Id) => (
            <Column
              column={entities.columns[columnId]}
              tasks={getTasks(entities, columnId)}
              selectedTaskIds={selected}
              key={columnId}
              select={this.select}
              unselect={this.unselect}
              multiSelectTo={this.multiSelectTo}
              addToSelection={this.addToSelection}
              removeFromSelection={this.removeFromSelection}
              isSomethingDragging={this.state.isDragging}
            />
          ))}
        </Container>
      </DragDropContext>
    );
  }
}
