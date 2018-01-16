// @flow
import type { Store as ReduxStore, Dispatch as ReduxDispatch } from 'redux';
import type { Action as ActionCreators } from './state/action-creators';

export type Id = string;
export type DraggableId = Id;
export type DroppableId = Id;
export type TypeId = Id;
export type ZIndex = number | string;

export type DroppableDescriptor = {|
  id: DroppableId,
  type: TypeId,
|}

export type DraggableDescriptor = {|
  id: DraggableId,
  droppableId: DroppableId,
  index: number,
|}

export type Position = {|
  x: number,
  y: number,
|};

// Kept as a loose type so that functions can
// accept Spacing and receive an Area or a Spacing
export type Spacing = {
  top: number,
  right: number,
  bottom: number,
  left: number,
}

export type Area = {|
  top: number,
  right: number,
  bottom: number,
  left: number,
  // additions to Spacing
  width: number,
  height: number,
  center: Position,
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

export type Placeholder = {|
  // We apply the margin separately to maintain margin collapsing
  // behavior of the original element
  withoutMargin: {|
    height: number,
    width: number,
  |},
  margin: Spacing,
|}

export type DraggableDimension = {|
  descriptor: DraggableDescriptor,
  // the placeholder for the draggable
  placeholder: Placeholder,
  // relative to the viewport when the drag started
  client: {|
    withMargin: Area,
    withoutMargin: Area,
  |},
  // relative to the whole page
  page: {|
    withMargin: Area,
    withoutMargin: Area,
  |},
|}

export type DroppableDimensionViewport = {|
  // This is the window through which the droppable is observed
  // It does not change during a drag
  // frame is null when the droppable has no frame
  frame: ?Area,
  // keeping track of the scroll
  frameScroll: {|
    initial: Position,
    current: Position,
    diff: {|
      value: Position,
      // The actual displacement as a result of a scroll is in the opposite
      // direction to the scroll itself. When scrolling down items are displaced
      // upwards. This value is the negated version of the 'value'
      displacement: Position,
    |}
  |},
  // The area to be clipped by the frame
  // This is the initial capture of the subject and is not updated
  subject: Area,
  // this is the subject through the viewport of the frame
  // it also takes into account any changes to the viewport scroll
  // clipped area will be null if it is completely outside of the frame
  clipped: ?Area,
|}

export type DroppableDimension = {|
  descriptor: DroppableDescriptor,
  axis: Axis,
  isEnabled: boolean,
  // relative to the current viewport
  client: {|
    withMargin: Area,
    withoutMargin: Area,
    // the area in which content presses up against
    withMarginAndPadding: Area,
  |},
  // relative to the whole page
  page: {|
    withMargin: Area,
    withoutMargin: Area,
    // the area in which content presses up against
    withMarginAndPadding: Area,
  |},
  // The container of the droppable
  viewport: DroppableDimensionViewport,
|}
export type DraggableLocation = {|
  droppableId: DroppableId,
  index: number
|};

export type DraggableDimensionMap = { [key: DraggableId]: DraggableDimension };
export type DroppableDimensionMap = { [key: DroppableId]: DroppableDimension };

export type Displacement = {|
  draggableId: DraggableId,
  isVisible: boolean,
  shouldAnimate: boolean,
|}

export type DragMovement = {|
  // The draggables that need to move in response to a drag.
  // Ordered by closest draggable to the *current* location of the dragging item
  displaced: Displacement[],
  amount: Position,
  // is moving forward relative to the starting position
  // TODO: rename to 'shouldDisplaceForward'?
  isBeyondStartPosition: boolean,
|}

export type DragImpact = {|
  movement: DragMovement,
  // the direction of the Droppable you are over
  direction: ?Direction,
  destination: ?DraggableLocation,
|}

export type InitialDragPositions = {|
  // where the user initially selected
  selection: Position,
  // the current center of the item
  center: Position,
|}

export type InitialDrag = {|
  descriptor: DraggableDescriptor,
  // whether scrolling is allowed - otherwise a scroll will cancel the drag
  isScrollAllowed: boolean,
  // relative to the viewport when the drag started
  client: InitialDragPositions,
  // viewport + window scroll (position relative to 0, 0)
  page: InitialDragPositions,
  // Storing scroll directly to support movement during a window scroll.
  // Value required for comparison with current scroll
  windowScroll: Position,
|}

export type CurrentDragPositions = {|
  ...InitialDragPositions,
  // how far the item has moved from its original position
  offset: Position,
|}

export type CurrentDrag = {|
  // viewport
  client: CurrentDragPositions,
  // viewport + scroll
  page: CurrentDragPositions,
  // Storing scroll directly to support movement during a window scroll.
  // Value required for comparison with current scroll
  windowScroll: Position,
  // whether or not draggable movements should be animated
  shouldAnimate: boolean,
|}

// type PreviousDrag = {
//   droppableOverId: ?DroppableId,
// };

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
  'COLLECTING_INITIAL_DIMENSIONS' |

  // A drag is active. The onDragStart hook has been fired
  'DRAGGING' |

  // An optional phase for animating the drop / cancel if it is needed
  'DROP_ANIMATING' |

  // The final state of a drop / cancel.
  // This will result in the onDragEnd hook being fired
  'DROP_COMPLETE';

export type DimensionState = {|
  // using the draggable id rather than the descriptor as the descriptor
  // may change as a result of the initial flush. This means that the lift
  // descriptor may not be the same as the actual descriptor. To avoid
  // confusion the request is just an id which is looked up
  // in the dimension-marshal post-flush
  request: ?DraggableId,
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
