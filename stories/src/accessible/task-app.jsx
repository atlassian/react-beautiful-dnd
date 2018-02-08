// @flow
import React, { Component } from 'react';
import TaskList from './task-list';
import initial from './data';
import reorder from '../reorder';
import { DragDropContext } from '../../../src/';
import type {
  DragStart,
  DragUpdate,
  DragResult,
  Announce,
} from '../../../src/';
import type { Task } from './types';

type State = {|
  tasks: Task[]
|}

const getPosition = (index: number, length: number): string => `
  ${index + 1} of ${length} in the list
`.trim();

const itemReturned = (index: number, length: number): string => `
  Item has returned to ${getPosition(index, length)}
`.trim();

export default class TaskApp extends Component<*, State> {
  state: State = {
    tasks: initial,
  }

  onDragStart = (start: DragStart, announce: Announce) => {
    announce(`
      Item lifted. ${getPosition(start.source.index, this.state.tasks.length)}.
      Use the arrow keys to move, space bar to drop, and escape to cancel
    `);
  }

  onDragUpdate = (update: DragUpdate, announce: Announce) => {
    if (!update.destination) {
      announce('You are currently not dragging over any droppable area');
      return;
    }
    announce(`Now ${getPosition(update.destination.index, this.state.tasks.length)}`);
  }

  onDragEnd = (result: DragResult, announce: Announce) => {
    if (result.reason === 'CANCEL') {
      announce(`
        Movement cancelled.
        ${itemReturned(result.source.index, this.state.tasks.length)}
      `);
      return;
    }

    if (!result.destination) {
      announce(`
        Item has been dropped while not over a location.
        ${itemReturned(result.source.index, this.state.tasks.length)}
      `);
      return;
    }

    announce(`
      Item dropped.
      It has moved from ${result.source.index + 1} to ${result.destination.index + 1}
    `);

    const tasks: Task[] = reorder(
      this.state.tasks,
      result.source.index,
      result.destination.index
    );

    this.setState({
      tasks,
    });
  }

  render() {
    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragUpdate={this.onDragUpdate}
        onDragEnd={this.onDragEnd}
      >
        <TaskList
          title="Todo"
          tasks={this.state.tasks}
        />
      </DragDropContext>
    );
  }
}
