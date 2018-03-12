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
import type { Entities, Column as ColumnType } from './types';

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
    window.addEventListener('click', this.onWindowClick);
    window.addEventListener('keydown', this.onWindowKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.onWindowClick);
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
    if (!destination || result.reason === 'CANCEL') {
      this.setState({
        isDragging: false,
      });
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
    if (event.defaultPrevented) {
      return;
    }

    if (event.key === 'Escape') {
      this.unselectAll();
    }
  }

  onWindowClick = (event: KeyboardEvent) => {
    if (event.defaultPrevented) {
      return;
    }
    this.unselectAll();
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
  multiSelectTo = (newTaskId: Id) => {
    const selectedTaskIds: Id[] = this.state.selectedTaskIds;
    // Nothing already selected
    if (!selectedTaskIds.length) {
      this.setState({
        selectedTaskIds: [newTaskId],
      });
      return;
    }

    // TODO: move to util file
    const columnOfNew: ColumnType = getHomeColumn(this.state.entities, newTaskId);
    const indexOfNew: number = columnOfNew.taskIds.indexOf(newTaskId);

    const lastSelected: Id = selectedTaskIds[selectedTaskIds.length - 1];
    const columnOfLast: ColumnType = getHomeColumn(this.state.entities, lastSelected);
    const indexOfLast: number = columnOfLast.taskIds.indexOf(lastSelected);

    // multi selecting to another column
    // select everything up to the index of the current item
    if (columnOfNew !== columnOfLast) {
      this.setState({
        selectedTaskIds: columnOfNew.taskIds.slice(0, indexOfNew + 1),
      });
      return;
    }

    // multi selecting in the same column
    // need to select everything between the last index and the current index inclusive

    // nothing to do here
    if (indexOfNew === indexOfLast) {
      return;
    }

    const isSelectingForwards: boolean = indexOfNew > indexOfLast;
    const start: number = isSelectingForwards ? indexOfLast : indexOfNew;
    const end: number = isSelectingForwards ? indexOfNew : indexOfLast;

    const inBetween: Id[] = columnOfNew.taskIds.slice(start, end + 1);

    const toAdd: Id[] = inBetween
      .filter((taskId: Id): boolean => {
        // if already selected: then no need to select it again
        if (selectedTaskIds.includes(taskId)) {
          return false;
        }
        return true;
      });

    const sorted: Id[] = isSelectingForwards ? toAdd : [...toAdd].reverse();
    const combined: Id[] = [...selectedTaskIds, ...sorted];

    this.setState({
      selectedTaskIds: combined,
    });
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
