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

export default class TaskApp extends Component<*, State> {
  state: State = {
    tasks: initial,
  }

  onDragStart = (start: DragStart, announce: Announce) => {

  }

  onDragUpdate = (update: DragUpdate, announce: Announce) => {

  }

  onDragEnd = (result: DragResult, announce: Announce) => {
    if (!result.destination) {
      return;
    }

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
        <TaskList tasks={this.state.tasks} />
      </DragDropContext>
    );
  }
}
