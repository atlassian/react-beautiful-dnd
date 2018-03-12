// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { Draggable } from '../../../src/';
import { grid, colors, borderRadius } from '../constants';
import type { DraggableProvided, DraggableStateSnapshot } from '../../../src/';
import type { Id, Task as TaskType } from '../types';

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
const primaryButton = 0;

type Props = {|
  task: TaskType,
  index: number,
  isSelected: boolean,
  isGhosting: boolean,
  selectionCount: number,
  toggleSelection: (taskId: Id) => void,
  toggleSelectionInGroup: (taskId: Id) => void,
  multiSelectTo: (taskId: Id) => void,
|}

type GetBackgroundColorArgs= {|
  isSelected: boolean,
  isDragging: boolean,
  isGhosting: boolean,
|}

const getBackgroundColor = ({
  isSelected,
  isDragging,
  isGhosting,
}: GetBackgroundColorArgs): string => {
  if (isDragging) {
    return colors.blue.light;
  }
  if (isGhosting) {
    return colors.grey;
  }
  if (isSelected) {
    return colors.blue.light;
  }
  return colors.white;
};

const Container = styled.div`
  border-bottom: 1px solid #ccc;
  background-color: ${props => getBackgroundColor(props)};
  color: ${props => (props.isSelected ? colors.blue.deep : colors.black)};
  padding: ${grid}px;
  margin-bottom: ${grid}px;
  border-radius: ${borderRadius}px;
  font-size: 18px;

  ${props => (props.isDragging ? `box-shadow: 1px 1px 1px grey; background: ${colors.blue.light};` : '')}
  ${props => (!props.isDragging && props.isGhosting ? 'opacity: 0.8;' : '')}

  /* needed for SelectionCount */
  position: relative;

  &:hover {
    /*background-color: ${colors.grey};*/
  }

  /* avoid default outline which looks lame with the position: absolute; */
  &:focus {
    outline: 2px solid ${colors.blue.light};
  }
`;

const Content = styled.div`
`;

const size: number = 30;

const SelectionCount = styled.div`
  right: -${grid}px;
  top: -${grid}px;
  color: ${colors.white};
  background: ${colors.blue.deep};
  border-radius: 50%;
  height: ${size}px;
  width: ${size}px;
  line-height: ${size}px;
  position: absolute;
  text-align: center;
  font-size: 0.8rem;
`;

const keyCodes = {
  enter: 13,
  escape: 27,
};

export default class Task extends Component<Props> {
  // Using onKeyUp so that we did not need to monkey patch onKeyDown
  onKeyUp = (event: KeyboardEvent, snapshot: DraggableStateSnapshot) => {
    if (event.keyCode !== keyCodes.enter) {
      return;
    }

    const {
      task,
      toggleSelection,
    } = this.props;

    if (snapshot.isDragging) {
      return;
    }

    // we are using the event
    event.preventDefault();
    toggleSelection(task.id);
  }

  // Using onClick as it will be correctly
  // preventing if there was a drag
  onClick = (event: MouseEvent) => {
    const {
      task,
      toggleSelection,
      toggleSelectionInGroup,
      multiSelectTo,
    } = this.props;

    if (event.defaultPrevented) {
      return;
    }

    if (event.button !== primaryButton) {
      return;
    }

    // marking the event as used
    event.preventDefault();

    const wasShiftKeyUsed: boolean = event.shiftKey;

    if (wasShiftKeyUsed) {
      multiSelectTo(task.id);
      return;
    }

    const wasMetaKeyUsed: boolean = event.metaKey;

    if (wasMetaKeyUsed) {
      toggleSelectionInGroup(task.id);
      return;
    }

    toggleSelection(task.id);
  };

  render() {
    const task: TaskType = this.props.task;
    const index: number = this.props.index;
    const isSelected: boolean = this.props.isSelected;
    const selectionCount: number = this.props.selectionCount;
    const isGhosting: boolean = this.props.isGhosting;
    return (
      <Draggable draggableId={task.id} index={index}>
        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
          <div>
            <Container
              innerRef={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              onClick={this.onClick}
              onKeyUp={(event: KeyboardEvent) => this.onKeyUp(event, snapshot)}
              isDragging={snapshot.isDragging}
              isSelected={isSelected}
              isGhosting={isGhosting}
            >
              <Content>{task.content}</Content>
              {snapshot.isDragging && selectionCount > 1 ?
                <SelectionCount>{selectionCount}</SelectionCount> : null
              }
            </Container>
            {provided.placeholder}
          </div>
        )}
      </Draggable>
    );
  }
}
