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
  amount: number,
  isMovingForward: boolean,
|}

export type DragImpact = {|
  movement: DragMovement,
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
  selection: Position,
  center: Position,
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

export type DropResult = {|
  draggableId: DraggableId,
  source: DraggableLocation,
  // may not have any destination (drag to nowhere)
  destination: ?DraggableLocation
|}

export type DragState = {|
  initial: InitialDrag,
  current: CurrentDrag,
  impact: DragImpact,
|}

export type PendingDrop = {|
  newHomeOffset: Position,
  last: DragState,
  result: DropResult,
|}

export type Direction = 'vertical'; // | horiztonal - currently not supported

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
  drop: ?DropState,
};

export type Action = ActionCreators;
export type Store = ReduxStore<State, Action>;
export type Dispatch = ReduxDispatch<Action>;

export type Hooks = {|
  onDragStart?: (id: DraggableId, location: DraggableLocation) => void,
  onDragEnd: (result: DropResult) => void,
|}

// These types are 'fake'. They really just resolve to 'any'.
// But it is useful for readability and intention
export type ReactClass = any;
export type ReactElement = any;
export type HTMLElement = any;

export type HOC = (Component: ReactClass) => ReactClass;
