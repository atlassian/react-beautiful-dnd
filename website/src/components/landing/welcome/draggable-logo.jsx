// @flow
import React from 'react';
import styled, { keyframes } from 'react-emotion';
import Logo from '../../logo';
import { DragDropContext, Droppable, Draggable } from '../../../../../src';
import type {
  DraggableProvided,
  DraggableStateSnapshot,
  DroppableProvided,
} from '../../../../../src';

const rotation: number = 10;

const minorRotation = keyframes`
  0% {
    transform: rotate(0deg);
  }

  25% {
    transform: rotate(${rotation}deg);
  }

  50% {
    transform: rotate(0deg), scale 1.2;
  }

  75% {
    transform: rotate(-${rotation}deg);
  }

  100% {
    transform: rotate(0deg);
  }
`;

// eslint-disable-next-line import/prefer-default-export
const shake = `${minorRotation} 0.5s linear infinite`;

const Shaker = styled('div')`
  animation: ${props => (props.shake ? shake : 'none')};
`;

export default class DraggableLogo extends React.Component<*> {
  render() {
    return (
      <DragDropContext onDragEnd={() => {}}>
        <Droppable droppableId="logo">
          {(droppableProvided: DroppableProvided) => (
            <div
              {...droppableProvided.droppableProps}
              ref={droppableProvided.innerRef}
            >
              <Draggable draggableId="logo" index={0}>
                {(
                  provided: DraggableProvided,
                  snapshot: DraggableStateSnapshot,
                ) => (
                  <div
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    ref={provided.innerRef}
                  >
                    <Shaker
                      shake={snapshot.isDragging && !snapshot.isDropAnimating}
                    >
                      <Logo width={90} />
                    </Shaker>
                  </div>
                )}
              </Draggable>
              {droppableProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}
