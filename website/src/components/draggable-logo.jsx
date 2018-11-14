// @flow
import React from 'react';
import styled, { keyframes } from 'react-emotion';
import Logo from './logo';
import { DragDropContext, Droppable, Draggable } from '../../../src';
import type {
  DraggableProvided,
  DraggableStateSnapshot,
  DroppableProvided,
  DropAnimation,
} from '../../../src';

const rotation: number = 10;
const hueRotation: number = 150;

const animations = {
  resting: keyframes`
    0% {
      filter: hue-rotate(0deg);
    }
    70% {
      filter: hue-rotate(0deg);
    }
    85% {
      filter: hue-rotate(${hueRotation}deg);
    }

    100% {
      filter: hue-rotate(0deg);
    }

  `,
  dragging: keyframes`
    0% {
      transform: rotate(0deg);
    }

    25% {
      transform: rotate(${rotation}deg) scale(1.1);
    }

    50% {
      transform: rotate(0deg) scale(0.9);
      filter: hue-rotate(${hueRotation}deg);
    }

    75% {
      transform: rotate(-${rotation}deg) scale(1.1);
    }

    100% {
      transform: rotate(0deg);
    }
  `,
  dropping: keyframes`
    50% {
      filter: hue-rotate(${hueRotation}deg);
    }
    100% {
      transform: rotate(359deg);
    }
  `,
};

const getAnimation = (
  isDragging: boolean,
  dropAnimation: DropAnimation,
): Object => {
  if (dropAnimation) {
    return {
      animationName: animations.dropping,
      animationDuration: `${dropAnimation.duration}s`,
      // a sharp animation curve. Finish the main rotation quickly and then ease
      // http://cubic-bezier.com/#0,1.05,.47,1
      animationTimingFunction: 'cubic-bezier(0,1.05,.47,1)',
      animationIterationCount: '1',
    };
  }
  if (isDragging) {
    return {
      animationName: animations.dragging,
      animationDuration: '0.5s',
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
    };
  }
  return {
    animationName: animations.resting,
    animationDuration: '10s',
    animationTimingFunction: 'ease',
    animationIterationCount: 'infinite',
  };
};

const Dance = styled('div')`
  ${props => getAnimation(props.isDragging, props.dropAnimation)};
`;

type Props = {|
  size: number,
|};

export default class DraggableLogo extends React.Component<Props> {
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
                    <Dance
                      isDragging={snapshot.isDragging}
                      dropAnimation={snapshot.dropAnimation}
                      style={{
                        width: this.props.size,
                        height: this.props.size,
                      }}
                    >
                      <Logo size={this.props.size} />
                    </Dance>
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
