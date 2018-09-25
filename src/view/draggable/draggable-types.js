// @flow
import { type Position } from 'css-box-model';
import { type Node } from 'react';
import type {
  DraggableId,
  DroppableId,
  DraggableDimension,
  ZIndex,
  State,
  DropReason,
  MovementMode,
} from '../../types';
import {
  lift,
  move,
  moveByWindowScroll,
  moveUp,
  moveDown,
  moveRight,
  moveLeft,
  drop,
  dropAnimationFinished,
} from '../../state/action-creators';
import type { DragHandleProps } from '../drag-handle/drag-handle-types';

export type DraggingStyle = {|
  position: 'fixed',
  top: number,
  left: number,
  boxSizing: 'border-box',
  width: number,
  height: number,
  transition: string,
  transform: ?string,
  zIndex: ZIndex,

  // for combining
  opacity: ?number,

  // Avoiding any processing of mouse events.
  // This is already applied by the shared styles during a drag.
  // During a drop it prevents a draggable from being dragged.
  // canStartDrag() will prevent drags in some cases for non primary draggable.
  // It is also a minor performance optimisation
  pointerEvents: 'none',
|};

export type NotDraggingStyle = {|
  transform: ?string,
  // null: use the global animation style
  // none: skip animation (used in certain displacement situations)
  transition: null | 'none',
|};

export type DraggableStyle = DraggingStyle | NotDraggingStyle;

export type ZIndexOptions = {|
  dragging: number,
  dropAnimating: number,
|};

// Props that can be spread onto the element directly
export type DraggableProps = {|
  // inline style
  style: ?DraggableStyle,
  // used for shared global styles
  'data-react-beautiful-dnd-draggable': string,
  // used to know when a transition ends
  onTransitionEnd: ?() => mixed,
|};

export type Provided = {|
  draggableProps: DraggableProps,
  // will be null if the draggable is disabled
  dragHandleProps: ?DragHandleProps,
  // The following props will be removed once we move to react 16
  innerRef: (?HTMLElement) => void,
|};

export type DroppingState = {|
  reason: DropReason,
  // to easily enable patching of styles
  duration: number,
  curve: string,
  // TODO: are these needed?
  moveTo: Position,
  opacity: ?number,
  scale: ?number,
|};

export type StateSnapshot = {|
  isDragging: boolean,
  dropping: ?DroppingState,
  draggingOver: ?DroppableId,
  combineWith: ?DraggableId,
  combineTargetFor: ?DraggableId,
  mode: ?MovementMode,
|};

export type DispatchProps = {|
  lift: typeof lift,
  move: typeof move,
  moveByWindowScroll: typeof moveByWindowScroll,
  moveUp: typeof moveUp,
  moveDown: typeof moveDown,
  moveRight: typeof moveRight,
  moveLeft: typeof moveLeft,
  drop: typeof drop,
  dropAnimationFinished: typeof dropAnimationFinished,
|};

export type DraggingMapProps = {|
  offset: Position,
  mode: MovementMode,
  dropping: ?DroppingState,
  dimension: DraggableDimension,
  draggingOver: ?DroppableId,
  combineWith: ?DraggableId,
  forceShouldAnimate: ?boolean,
|};

export type SecondaryMapProps = {|
  offset: Position,
  combineTargetFor: ?DraggableId,
  shouldAnimateDisplacement: boolean,
|};

export type MapProps = {|
  // when an item is being displaced by a dragging item,
  // we need to know if that movement should be animated
  dragging: ?DraggingMapProps,
  secondary: ?SecondaryMapProps,
|};

export type ChildrenFn = (Provided, StateSnapshot) => ?Node;

export type OwnProps = {|
  draggableId: DraggableId,
  index: number,
  children: ChildrenFn,
  isDragDisabled: boolean,
  disableInteractiveElementBlocking: boolean,
|};

export type DefaultProps = {|
  isDragDisabled: boolean,
  disableInteractiveElementBlocking: boolean,
|};

export type Props = {|
  ...MapProps,
  ...DispatchProps,
  ...OwnProps,
|};

export type Selector = (state: State, ownProps: OwnProps) => MapProps;
