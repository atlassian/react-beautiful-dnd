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
  isGhosting,
}: GetBackgroundColorArgs): string => {
  if (isGhosting) {
    return colors.grey2.light;
  }

  if (isSelected) {
    return colors.blue.light;
  }

  return colors.grey2.light;
};

const getColor = ({
  isSelected,
  isGhosting,
}): string => {
  if (isGhosting) {
    return 'darkgrey';
  }
  if (isSelected) {
    return colors.blue.deep;
  }
  return colors.black;
};

const Container = styled.div`
  background-color: ${props => getBackgroundColor(props)};
  color: ${props => getColor(props)};
  padding: ${grid}px;
  margin-bottom: ${grid}px;
  border-radius: ${borderRadius}px;4
  font-size: 18px;
  border: 1px solid ${colors.shadow};

  ${props => (props.isDragging ? `box-shadow: 2px 2px 1px ${colors.shadow};` : '')}
  ${props => (props.isGhosting ? 'opacity: 0.8;' : '')}

  /* needed for SelectionCount */
  position: relative;

  &:hover {
    /*background-color: ${colors.grey};*/
  }

  /* avoid default outline which looks lame with the position: absolute; */
  &:focus {
    outline: none;
    /* TODO: also need to add dragging shadow */
    border-color: ${colors.blue.deep};
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
  arrowDown: 40,
  arrowUp: 38,
  tab: 9,
};

export default class Task extends Component<Props> {
  onKeyDown = (
    event: KeyboardEvent,
    provided: DraggableProvided,
    snapshot: DraggableStateSnapshot
  ) => {
    if (provided.dragHandleProps) {
      provided.dragHandleProps.onKeyDown(event);
    }

    if (event.defaultPrevented) {
      return;
    }

    if (snapshot.isDragging) {
      return;
    }

    if (event.keyCode !== keyCodes.enter) {
      return;
    }

    // we are using the event for selection
    event.preventDefault();

    const wasMetaKeyUsed: boolean = event.metaKey;
    const wasShiftKeyUsed: boolean = event.shiftKey;

    this.performAction(wasMetaKeyUsed, wasShiftKeyUsed);
  }

  // Using onClick as it will be correctly
  // preventing if there was a drag
  onClick = (event: MouseEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    if (event.button !== primaryButton) {
      return;
    }

    // marking the event as used
    event.preventDefault();

    const wasMetaKeyUsed: boolean = event.metaKey;
    const wasShiftKeyUsed: boolean = event.shiftKey;

    this.performAction(wasMetaKeyUsed, wasShiftKeyUsed);
  };

  performAction = (wasMetaKeyUsed: boolean, wasShiftKeyUsed: boolean) => {
    const {
      task,
      toggleSelection,
      toggleSelectionInGroup,
      multiSelectTo,
    } = this.props;

    if (wasMetaKeyUsed) {
      toggleSelectionInGroup(task.id);
      return;
    }

    if (wasShiftKeyUsed) {
      multiSelectTo(task.id);
      return;
    }

    toggleSelection(task.id);
  }

  render() {
    const task: TaskType = this.props.task;
    const index: number = this.props.index;
    const isSelected: boolean = this.props.isSelected;
    const selectionCount: number = this.props.selectionCount;
    const isGhosting: boolean = this.props.isGhosting;
    return (
      <Draggable draggableId={task.id} index={index}>
        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
          const shouldShowSelection: boolean = snapshot.isDragging && selectionCount > 1;

          return (
            <div>
              <Container
                innerRef={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                onClick={this.onClick}
                onKeyDown={(event: KeyboardEvent) => this.onKeyDown(event, provided, snapshot)}
                isDragging={snapshot.isDragging}
                isSelected={isSelected}
                isGhosting={isGhosting}
              >
                <Content>{task.content}</Content>
                {shouldShowSelection ? <SelectionCount>{selectionCount}</SelectionCount> : null}
              </Container>
              {provided.placeholder}
            </div>
          );
        }}
      </Draggable>
    );
  }
}
