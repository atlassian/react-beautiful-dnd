// @flow
import { type Position } from 'css-box-model';
import { type Node } from 'react';
import type {
  DraggableId,
  DroppableId,
  DraggableDimension,
  State,
  MovementMode,
  ContextId,
} from '../../types';
import type { AppContextValue } from '../context/app-context';
import type { DroppableContextValue } from '../context/droppable-context';
import { dropAnimationFinished } from '../../state/action-creators';

export type DraggingStyle = {|
  position: 'fixed',
  top: number,
  left: number,
  boxSizing: 'border-box',
  width: number,
  height: number,
  transition: string,
  transform: ?string,
  zIndex: number,

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
  'data-rbd-draggable-context-id': string,
  'data-rbd-draggable-id': string,
  'data-rbd-draggable-options': string,
  // used to know when a transition ends
  onTransitionEnd: ?(event: TransitionEvent) => void,
|};

export type DragHandleProps = {|
  // what draggable the handle belongs to
  'data-rbd-drag-handle-draggable-id': DraggableId,

  // What DragDropContext the drag handle is in
  'data-rbd-drag-handle-context-id': ContextId,

  // Aria role (nicer screen reader text)
  'aria-roledescription': string,

  // Allow tabbing to this element
  tabIndex: number,

  // Stop html5 drag and drop
  draggable: boolean,
  onDragStart: (event: DragEvent) => void,
|};

export type Provided = {|
  draggableProps: DraggableProps,
  // will be null if the draggable is disabled
  dragHandleProps: ?DragHandleProps,
  // The following props will be removed once we move to react 16
  innerRef: (?HTMLElement) => void,
|};

// to easily enable patching of styles
export type DropAnimation = {|
  duration: number,
  curve: string,
  moveTo: Position,
  opacity: ?number,
  scale: ?number,
|};

export type StateSnapshot = {|
  isDragging: boolean,
  isDropAnimating: boolean,
  dropAnimation: ?DropAnimation,
  draggingOver: ?DroppableId,
  combineWith: ?DraggableId,
  combineTargetFor: ?DraggableId,
  mode: ?MovementMode,
|};

export type DispatchProps = {|
  dropAnimationFinished: typeof dropAnimationFinished,
|};

export type DraggingMapProps = {|
  type: 'DRAGGING',
  offset: Position,
  mode: MovementMode,
  dropping: ?DropAnimation,
  draggingOver: ?DraggableId,
  combineWith: ?DraggableId,
  dimension: DraggableDimension,
  forceShouldAnimate: ?boolean,
  snapshot: StateSnapshot,
|};

export type SecondaryMapProps = {|
  type: 'SECONDARY',
  offset: Position,
  combineTargetFor: ?DraggableId,
  shouldAnimateDisplacement: boolean,
  snapshot: StateSnapshot,
|};

export type MappedProps = DraggingMapProps | SecondaryMapProps;

export type MapProps = {|
  // when an item is being displaced by a dragging item,
  // we need to know if that movement should be animated
  mapped: MappedProps,
  // dragging: ?DraggingMapProps,
  // secondary: ?SecondaryMapProps,
|};

export type ChildrenFn = (Provided, StateSnapshot) => Node | null;

export type PublicOwnProps = {|
  draggableId: DraggableId,
  index: number,
  children: ChildrenFn,

  // optional own props
  isDragDisabled?: boolean,
  disableInteractiveElementBlocking?: boolean,
  shouldRespectForcePress?: boolean,
|};

export type PrivateOwnProps = {|
  ...PublicOwnProps,
  isClone: boolean,

  // no longer optional
  isEnabled: boolean,
  canDragInteractiveElements: boolean,
  shouldRespectForcePress: boolean,
|};

export type OwnProps = {|
  ...PrivateOwnProps,
  droppableContext: DroppableContextValue,
  appContext: AppContextValue,
|};

export type Props = {|
  ...MapProps,
  ...DispatchProps,
  ...OwnProps,
|};

export type Selector = (state: State, ownProps: OwnProps) => MapProps;
