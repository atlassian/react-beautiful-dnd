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
  DropResult,
  DraggableLocation,
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

  onDragStart = (start: DragStart): string => `
    Item lifted. ${getPosition(start.source.index, this.state.tasks.length)}.
    Use the arrow keys to move, space bar to drop, and escape to cancel
  `

  onDragUpdate = (update: DragUpdate): string => {
    if (!update.destination) {
      return 'You are currently not dragging over any droppable area';
    }
    return `Now ${getPosition(update.destination.index, this.state.tasks.length)}`;
  }

  onDragEnd = (result: DropResult): string => {
    if (result.reason === 'CANCEL') {
      return `
        Movement cancelled.
        ${itemReturned(result.source.index, this.state.tasks.length)}
      `;
    }

    const desination: ?DraggableLocation = result.destination;

    if (!desination) {
      return `
        Item has been dropped while not over a location.
        ${itemReturned(result.source.index, this.state.tasks.length)}
      `;
    }

    const tasks: Task[] = reorder(
      this.state.tasks,
      result.source.index,
      desination.index,
    );

    this.setState({
      tasks,
    });

    return `
      Item dropped.
      It has moved from ${result.source.index + 1} to ${desination.index + 1}
    `;
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
