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
  top: number,
  left: number,
  bottom: number,
  right: number,
  width: number,
  height: number,
  center: Position,
|}

export type DraggableDimension = {|
  id: DraggableId,
  droppableId: DroppableId,
  page: {|
    withMargin: DimensionFragment,
    withoutMargin: DimensionFragment,
  |},
  client: {|
    withMargin: DimensionFragment,
    withoutMargin: DimensionFragment,
  |}
|}

export type DroppableDimension = {|
  id: DroppableId,
  axis: Axis,
  scroll: {|
    initial: Position,
    current: Position,
  |},
  page: {|
    withMargin: DimensionFragment,
    withoutMargin: DimensionFragment,
  |}
|}
export type DraggableLocation = {|
  droppableId: DroppableId,
  index: number
|};

export type DraggableDimensionMap = { [key: DraggableId]: DraggableDimension };
export type DroppableDimensionMap = { [key: DroppableId]: DroppableDimension };

export type DragMovement = {|
  draggables: DraggableId[],
  amount: Position,
  // is moving forward relative to the starting position
  isBeyondStartPosition: boolean,
|}

export type DragImpact = {|
  movement: DragMovement,
  // the direction of the Droppable you are over
  direction: ?Direction,
  destination: ?DraggableLocation
|}

export type InitialDragLocation = {|
  selection: Position,
  center: Position,
|}

export type WithinDroppable = {|
  center: Position,
|}

export type InitialDrag = {|
  source: DraggableLocation,
  // viewport
  client: InitialDragLocation,
  // viewport + window scroll
  page: InitialDragLocation,
  // Storing scroll directly to support movement during a window scroll.
  // Value required for comparison with current scroll
  windowScroll: Position,
  // viewport + window scroll + droppable scroll diff
  // (this will be the same as page initially)
  withinDroppable: WithinDroppable,
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
  // viewport
  client: CurrentDragLocation,
  // viewport + scroll
  page: CurrentDragLocation,
  // Storing scroll directly to support movement during a window scroll.
  // Value required for comparison with current scroll
  windowScroll: Position,
  // viewport + scroll + droppable scroll
  withinDroppable: WithinDroppable,
  shouldAnimate: boolean,
|}

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
  destination: ?DraggableLocation
|}

export type DragState = {|
  initial: InitialDrag,
  current: CurrentDrag,
  impact: DragImpact,
|}

export type DropTrigger = 'DROP' | 'CANCEL';

export type PendingDrop = {|
  trigger: DropTrigger,
  newHomeOffset: Position,
  impact: DragImpact,
  result: DropResult,
|}

export type Phase = 'IDLE' | 'COLLECTING_DIMENSIONS' | 'DRAGGING' | 'DROP_ANIMATING' | 'DROP_COMPLETE';

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
export type Store = ReduxStore<State, Action>;
export type Dispatch = ReduxDispatch<Action>;

export type Hooks = {|
  onDragStart?: (start: DragStart) => void,
  onDragEnd: (result: DropResult) => void,
|}

// These types are 'fake'. They really just resolve to 'any'.
// But it is useful for readability and intention
export type ReactClass = any;
export type ReactElement = any;
export type HTMLElement = any;

export type HOC = (Component: ReactClass) => ReactClass;
