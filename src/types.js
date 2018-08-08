// @flow
import type { BoxModel, Rect, Position } from 'css-box-model';

export type Id = string;
export type DraggableId = Id;
export type DroppableId = Id;
export type TypeId = Id;
export type ZIndex = number | string;

export type DroppableDescriptor = {|
  id: DroppableId,
  type: TypeId,
|};

export type DraggableDescriptor = {|
  id: DraggableId,
  index: number,
  // Inherited from Droppable
  droppableId: DroppableId,
  // This is technically redundant but it avoids
  // needing to look up a parent droppable just to get its type
  type: TypeId,
|};

export type Direction = 'horizontal' | 'vertical';

export type VerticalAxis = {|
  direction: 'vertical',
  line: 'y',
  start: 'top',
  end: 'bottom',
  size: 'height',
  crossAxisLine: 'x',
  crossAxisStart: 'left',
  crossAxisEnd: 'right',
  crossAxisSize: 'width',
|};

export type HorizontalAxis = {|
  direction: 'horizontal',
  line: 'x',
  start: 'left',
  end: 'right',
  size: 'width',
  crossAxisLine: 'y',
  crossAxisStart: 'top',
  crossAxisEnd: 'bottom',
  crossAxisSize: 'height',
|};

export type Axis = VerticalAxis | HorizontalAxis;

export type Placeholder = {|
  client: BoxModel,
  tagName: string,
  display: string,
|};

export type DraggableDimension = {|
  descriptor: DraggableDescriptor,
  // the placeholder for the draggable
  placeholder: Placeholder,
  // relative to the viewport when the drag started
  client: BoxModel,
  // relative to the whole page
  page: BoxModel,
|};

export type Scrollable = {|
  // This is the window through which the droppable is observed
  // It does not change during a drag
  framePageMarginBox: Rect,
  // Whether or not we should clip the subject by the frame
  // Is controlled by the ignoreContainerClipping prop
  shouldClipSubject: boolean,
  scroll: {|
    initial: Position,
    current: Position,
    // the maximum allowable scroll for the frame
    max: Position,
    diff: {|
      value: Position,
      // The actual displacement as a result of a scroll is in the opposite
      // direction to the scroll itself. When scrolling down items are displaced
      // upwards. This value is the negated version of the 'value'
      displacement: Position,
    |},
  |},
|};

export type DroppableDimensionViewport = {|
  // will be null if there is no closest scrollable
  closestScrollable: ?Scrollable,
  subjectPageMarginBox: Rect,
  // this is the subject through the viewport of the frame (if applicable)
  // it also takes into account any changes to the viewport scroll
  // clipped area will be null if it is completely outside of the frame and frame clipping is on
  clippedPageMarginBox: ?Rect,
|};

export type DroppableDimension = {|
  descriptor: DroppableDescriptor,
  axis: Axis,
  isEnabled: boolean,
  // relative to the current viewport
  client: BoxModel,
  // relative to the whole page
  page: BoxModel,
  // The container of the droppable
  viewport: DroppableDimensionViewport,
|};
export type DraggableLocation = {|
  droppableId: DroppableId,
  index: number,
|};

export type DraggableDimensionMap = { [key: DraggableId]: DraggableDimension };
export type DroppableDimensionMap = { [key: DroppableId]: DroppableDimension };

export type Displacement = {|
  draggableId: DraggableId,
  isVisible: boolean,
  shouldAnimate: boolean,
|};

export type DragMovement = {|
  // The draggables that need to move in response to a drag.
  // Ordered by closest draggable to the *current* location of the dragging item
  displaced: Displacement[],
  amount: Position,
  // is moving forward relative to the starting position
  // TODO: rename to 'shouldDisplaceForward'?
  isBeyondStartPosition: boolean,
|};

export type DragImpact = {|
  movement: DragMovement,
  // the direction of the Droppable you are over
  direction: ?Direction,
  destination: ?DraggableLocation,
|};

export type ItemPositions = {|
  // where the user initially selected
  // This point is not used to calculate the impact of a dragging item
  // It is used to calculate the offset from the initial selection point
  selection: Position,
  // the current center of the item
  borderBoxCenter: Position,
  // how far the item has moved from its original position
  offset: Position,
|};

// When dragging with a pointer such as a mouse or touch input we want to automatically
// scroll user the under input when we get near the bottom of a Droppable or the window.
// When Dragging with a keyboard we want to jump as required
export type AutoScrollMode = 'FLUID' | 'JUMP';

// export type Viewport = {|
//   scroll: Position,
//   maxScroll: Position,
//   subject: Rect,
// |}

export type DragPositions = {|
  client: ItemPositions,
  page: ItemPositions,
|};

// published when a drag starts
export type DragStart = {|
  draggableId: DraggableId,
  type: TypeId,
  source: DraggableLocation,
|};

export type DragUpdate = {|
  ...DragStart,
  // may not have any destination (drag to nowhere)
  destination: ?DraggableLocation,
|};

export type DropReason = 'DROP' | 'CANCEL';

// published when a drag finishes
export type DropResult = {|
  ...DragUpdate,
  reason: DropReason,
|};

export type PendingDrop = {|
  // TODO: newHomeClientOffset
  newHomeOffset: Position,
  impact: DragImpact,
  result: DropResult,
|};

export type ScrollOptions = {|
  shouldPublishImmediately: boolean,
|};

// using the draggable id rather than the descriptor as the descriptor
// may change as a result of the initial flush. This means that the lift
// descriptor may not be the same as the actual descriptor. To avoid
// confusion the request is just an id which is looked up
// in the dimension-marshal post-flush
// Not including droppableId as it might change in a drop flush
export type LiftRequest = {|
  draggableId: DraggableId,
  scrollOptions: ScrollOptions,
|};

export type Critical = {|
  draggable: DraggableDescriptor,
  droppable: DroppableDescriptor,
|};

export type Viewport = {|
  // live updates with the latest values
  frame: Rect,
  scroll: {|
    initial: Position,
    current: Position,
    max: Position,
    diff: {|
      value: Position,
      // The actual displacement as a result of a scroll is in the opposite
      // direction to the scroll itself.
      displacement: Position,
    |},
  |},
|};

export type DimensionMap = {|
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
|};

export type Publish = {|
  additions: {|
    draggables: DraggableDimension[],
    droppables: DroppableDimension[],
  |},
  // additions: DimensionMap,
  removals: {|
    draggables: DraggableId[],
    droppables: DroppableId[],
  |},
|};

export type IdleState = {|
  phase: 'IDLE',
|};

export type PreparingState = {|
  phase: 'PREPARING',
|};

export type DraggingState = {|
  phase: 'DRAGGING',
  isDragging: true,
  critical: Critical,
  autoScrollMode: AutoScrollMode,
  dimensions: DimensionMap,
  initial: DragPositions,
  current: DragPositions,
  impact: DragImpact,
  viewport: Viewport,
  // if we need to jump the scroll (keyboard dragging)
  scrollJumpRequest: ?Position,
  // whether or not draggable movements should be animated
  shouldAnimate: boolean,
  // We release onDragStart to the consumer after the reducer has been updated
  // However, we do not want to apply any of the styles until onDragStart has finished
  shouldApplyChanges: boolean,
|};

// While dragging we can enter into a bulk collection phase
// During this phase no drag updates are permitted.
// If a drop occurs during this phase, it must wait until it is
// completed before continuing with the drop
// TODO: rename to BulkCollectingState
export type CollectingState = {|
  ...DraggingState,
  phase: 'COLLECTING',
|};

// If a drop action occurs during a bulk collection we need to
// wait for the collection to finish before performing the drop.
// This is to ensure that everything has the correct index after
// a drop
export type DropPendingState = {|
  ...DraggingState,
  phase: 'DROP_PENDING',
  isWaiting: boolean,
  reason: DropReason,
|};

// An optional phase for animating the drop / cancel if it is needed
export type DropAnimatingState = {|
  phase: 'DROP_ANIMATING',
  pending: PendingDrop,
  // We still need to render placeholders and fix the dimensions of the dragging item
  dimensions: DimensionMap,
|};

export type State =
  | IdleState
  | PreparingState
  | DraggingState
  | CollectingState
  | DropPendingState
  | DropAnimatingState;

export type Announce = (message: string) => void;

export type HookProvided = {|
  announce: Announce,
|};

export type OnDragStartHook = (
  start: DragStart,
  provided: HookProvided,
) => void;
export type OnDragUpdateHook = (
  update: DragUpdate,
  provided: HookProvided,
) => void;
export type OnDragEndHook = (
  result: DropResult,
  provided: HookProvided,
) => void;

export type Hooks = {|
  onDragStart?: OnDragStartHook,
  onDragUpdate?: OnDragUpdateHook,
  // always required
  onDragEnd: OnDragEndHook,
|};
