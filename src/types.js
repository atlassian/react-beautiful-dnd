// @flow
import type { Store as ReduxStore, Dispatch as ReduxDispatch } from 'redux';
import type { Action as ActionCreators } from './state/action-creators';

export type Id = string;
export type DraggableId = Id;
export type DroppableId = Id;
export type TypeId = Id;
export type ZIndex = number | string;

export type Position = {|
  x: number,
  y: number,
|};

export type Spacing = {
  top: number,
  right: number,
  bottom: number,
  left: number,
}

export type ClientRect = {|
  top: number,
  right: number,
  bottom: number,
  left: number,
  width: number,
  height: number,
|}

export type Direction = 'horizontal' | 'vertical';

export type VerticalAxis = {|
  direction: 'vertical',
  line: 'y',
  crossLine: 'x',
  start: 'top',
  end: 'bottom',
  size: 'height',
  crossAxisStart: 'left',
  crossAxisEnd: 'right',
  crossAxisSize: 'width',
|}

export type HorizontalAxis = {|
  direction: 'horizontal',
  line: 'x',
  crossLine: 'y',
  start: 'left',
  end: 'right',
  size: 'width',
  crossAxisStart: 'top',
  crossAxisEnd: 'bottom',
  crossAxisSize: 'height',
|}

export type Axis = VerticalAxis | HorizontalAxis

export type DimensionFragment = {|
  ...ClientRect,
  center: Position,
|}

export type Placeholder = {|
  withoutMargin: {|
    height: number,
    width: number,
  |},
  // we apply the margin seperately to avoid margin collapsing
  margin: Spacing,
|}

export type DraggableDimension = {|
  id: DraggableId,
  droppableId: DroppableId,
  // the placeholder for the draggable
  placeholder: Placeholder,
  // relative to the viewport when the drag started
  client: {|
    withMargin: DimensionFragment,
    withoutMargin: DimensionFragment,
  |},
  // relative to the whole page
  page: {|
    withMargin: DimensionFragment,
    withoutMargin: DimensionFragment,
  |},
|}

export type DroppableDimension = {|
  id: DroppableId,
  axis: Axis,
  isEnabled: boolean,
  // relative to the current viewport
  client: {|
    withMargin: DimensionFragment,
    withoutMargin: DimensionFragment,
    // the area in which content presses up against
    withMarginAndPadding: DimensionFragment,
  |},
  // relative to the whole page
  page: {|
    withMargin: DimensionFragment,
    withoutMargin: DimensionFragment,
    // the area in which content presses up against
    withMarginAndPadding: DimensionFragment,
  |},
  // Some droppables will have a scroll container - either themselves or a parent element.
  // We need to take into account the dimensions and scroll of this container when calculating
  // the true visible area of the droppable. If the droppable doesn't have scrolling then
  // the dimension of the container will be the same as the dimensions of the droppable itself.
  container: {|
    scroll: {|
      initial: Position,
      current: Position,
    |},
    bounds: DimensionFragment,
  |},
|}
export type DraggableLocation = {|
  droppableId: DroppableId,
  index: number
|};

export type DraggableDimensionMap = { [key: DraggableId]: DraggableDimension };
export type DroppableDimensionMap = { [key: DroppableId]: DroppableDimension };

export type DragMovement = {|
  // The draggables that need to move in response to a drag.
  // Ordered by closest draggable to the *current* location of the dragging item
  draggables: DraggableId[],
  amount: Position,
  // is moving forward relative to the starting position
  isBeyondStartPosition: boolean,
|}

export type DragImpact = {|
  movement: DragMovement,
  // the direction of the Droppable you are over
  direction: ?Direction,
  destination: ?DraggableLocation,
|}

export type InitialDragLocation = {|
  selection: Position,
  center: Position,
|}

export type InitialDrag = {|
  source: DraggableLocation,
  // relative to the viewport when the drag started
  client: InitialDragLocation,
  // viewport + window scroll (position relative to 0, 0)
  page: InitialDragLocation,
  // Storing scroll directly to support movement during a window scroll.
  // Value required for comparison with current scroll
  windowScroll: Position,
|}

export type CurrentDragLocation = {|
  // where the user initially selected
  selection: Position,
  // the current center of the item
  center: Position,
  // how far the item has moved from its original position
  offset: Position,
|}

export type CurrentDrag = {|
  id: DraggableId,
  type: TypeId,
  // whether scrolling is allowed - otherwise a scroll will cancel the drag
  isScrollAllowed: boolean,
  // viewport
  client: CurrentDragLocation,
  // viewport + scroll
  page: CurrentDragLocation,
  // Storing scroll directly to support movement during a window scroll.
  // Value required for comparison with current scroll
  windowScroll: Position,
  // whether or not movements should be animated
  shouldAnimate: boolean,
|}

type PreviousDrag = {
  droppableOverId: ?DroppableId,
};

// published when a drag starts
export type DragStart = {|
  draggableId: DraggableId,
  type: TypeId,
  source: DraggableLocation,
|}

// published when a drag finishes
export type DropResult = {|
  draggableId: DraggableId,
  type: TypeId,
  source: DraggableLocation,
  // may not have any destination (drag to nowhere)
  destination: ?DraggableLocation,
|}

export type DragState = {|
  initial: InitialDrag,
  current: CurrentDrag,
  impact: DragImpact,
  previous?: PreviousDrag,
|}

export type DropTrigger = 'DROP' | 'CANCEL';

export type PendingDrop = {|
  trigger: DropTrigger,
  newHomeOffset: Position,
  impact: DragImpact,
  result: DropResult,
|}

export type Phase =
  // The application rest state
  'IDLE' |

  // When a drag starts we need to flush any existing animations
  // that might be occurring. While this flush is occurring we
  // are in this phase
  'PREPARING' |

  // After the animations have been flushed we need to collect the
  // dimensions of all of the Draggable and Droppable components.
  // At this point a drag has not started yet and the onDragStart
  // hook has not fired.
  'COLLECTING_DIMENSIONS' |

  // A drag is active. The onDragStart hook has been fired
  'DRAGGING' |

  // An optional phase for animating the drop / cancel if it is needed
  'DROP_ANIMATING' |

  // The final state of a drop / cancel.
  // This will result in the onDragEnd hook being fired
  'DROP_COMPLETE';

export type DimensionState = {|
  request: ?TypeId,
  draggable: DraggableDimensionMap,
  droppable: DroppableDimensionMap,
|};

export type DropState = {|
  pending: ?PendingDrop,
  result: ?DropResult,
|}

export type State = {
  phase: Phase,
  dimension: DimensionState,
  // null if not dragging
  drag: ?DragState,

  // available when dropping or cancelling
  drop: ?DropState,
};

export type Action = ActionCreators;
export type Dispatch = ReduxDispatch<Action>;
export type Store = ReduxStore<State, Action, Dispatch>;

export type Hooks = {|
  onDragStart?: (start: DragStart) => void,
  onDragEnd: (result: DropResult) => void,
|}
