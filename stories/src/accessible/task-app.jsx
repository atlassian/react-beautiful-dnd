// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import TaskList from './task-list';
import initial from './data';
import reorder from '../reorder';
import { grid } from '../constants';
import { DragDropContext } from '../../../src/';
import type {
  DragStart,
  DragUpdate,
  DragResult,
  Announce,
} from '../../../src/';
import type { Task } from './types';

type State = {|
  tasks: Task[],
  blur: number,
|}

const Container = styled.div`
  margin-top: 20vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const Blur = styled.div`
  filter: blur(${props => props.amount}px);
`;

const BlurControls = styled.div`
  display: flex;
  align-items: center;
  font-size: 20px;
  margin-top: 20vh;
`;

const BlurTitle = styled.h4`
  margin: 0;

`;

const Button = styled.button`
  height: ${grid * 5}px;
  width: ${grid * 5}px;
  font-size: 20px;
  justify-content: center;
  margin: 0 ${grid * 2}px
`;

const getPosition = (index: number, length: number): string => `
  ${index + 1} of ${length} in the list
`.trim();

const itemReturned = (index: number, length: number): string => `
  Item has returned to ${getPosition(index, length)}
`.trim();

export default class TaskApp extends Component<*, State> {
  state: State = {
    tasks: initial,
    blur: 0,
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
        <Container>
          <Blur amount={this.state.blur}>
            <TaskList
              title="Todo"
              tasks={this.state.tasks}
            />
          </Blur>
          <BlurControls>
            <Button
              aria-label="remove blur"
              onClick={() => this.setState({ blur: Math.max(0, this.state.blur - 1) })}
            >
              -
            </Button>
            <BlurTitle>Blur</BlurTitle>
            <Button
              aria-label="add blur"
              onClick={() => this.setState({ blur: Math.min(this.state.blur + 1, 10) })}
            >
              +
            </Button>
          </BlurControls>
        </Container>
      </DragDropContext>
    );
  }
}
