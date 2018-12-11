// @flow
import React, { type Node } from 'react';
import ReactDOM from 'react-dom';
import styled, { keyframes } from 'styled-components';
import invariant from 'tiny-invariant';
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

const Dance = styled.div`
  /* TODO: rework for styled-components v4 */
  /* ${props => getAnimation(props.isDragging, props.dropAnimation)}; */
`;

type Props = {|
  usePortal: boolean,
  size: number,
|};

const getBody = (): HTMLBodyElement => {
  invariant(document.body);
  return document.body;
};

type WithPortalProps = {|
  snapshot: DraggableStateSnapshot,
  provided: DraggableProvided,
  size: number,
  usePortal: boolean,
|};

class WithPortal extends React.Component<WithPortalProps> {
  portal: ?HTMLElement = null;

  componentDidMount() {
    const portal: HTMLElement = document.createElement('div');
    getBody().appendChild(portal);
    this.portal = portal;
  }

  componentWillUnmount() {
    getBody().removeChild(this.getPortal());
    this.portal = null;
  }

  getPortal = (): HTMLElement => {
    invariant(this.portal);
    return this.portal;
  };

  render() {
    const { provided, snapshot, size, usePortal } = this.props;
    const child: Node = (
      <div
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        ref={provided.innerRef}
      >
        <Dance
          isDragging={snapshot.isDragging}
          dropAnimation={snapshot.dropAnimation}
          style={{
            width: size,
            height: size,
          }}
        >
          <Logo size={size} />
        </Dance>
      </div>
    );

    if (usePortal && snapshot.isDragging) {
      return ReactDOM.createPortal(child, this.getPortal());
    }

    return child;
  }
}
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
                  <WithPortal
                    provided={provided}
                    snapshot={snapshot}
                    size={this.props.size}
                    usePortal={this.props.usePortal}
                  />
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
