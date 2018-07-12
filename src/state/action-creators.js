// @flow
import type { Position } from 'css-box-model';
import type {
  Critical,
  DraggableId,
  DroppableId,
  DropResult,
  ItemPositions,
  AutoScrollMode,
  Viewport,
  DimensionMap,
  DropReason,
  PendingDrop,
  Published,
} from '../types';

export type LiftArgs = {|
  // lifting with DraggableId rather than descriptor
  // as the descriptor might change after a drop is flushed
  id: DraggableId,
  client: ItemPositions,
  viewport: Viewport,
  autoScrollMode: AutoScrollMode,
|};

export type LiftAction = {|
  type: 'LIFT',
  payload: LiftArgs,
|};

export const lift = (args: LiftArgs): LiftAction => ({
  type: 'LIFT',
  payload: args,
});

export type InitialPublishArgs = {|
  critical: Critical,
  dimensions: DimensionMap,
  client: ItemPositions,
  viewport: Viewport,
  autoScrollMode: AutoScrollMode,
|};

export type InitialPublishAction = {|
  type: 'INITIAL_PUBLISH',
  payload: InitialPublishArgs,
|};

export const initialPublish = (
  args: InitialPublishArgs,
): InitialPublishAction => ({
  type: 'INITIAL_PUBLISH',
  payload: args,
});

export type PublishAction = {|
  type: 'PUBLISH',
  payload: Published,
|};

export const publish = (args: Published): PublishAction => ({
  type: 'PUBLISH',
  payload: args,
});

export type CollectionStartingAction = {|
  type: 'COLLECTION_STARTING',
  payload: null,
|};

export const collectionStarting = (): CollectionStartingAction => ({
  type: 'COLLECTION_STARTING',
  payload: null,
});

export type UpdateDroppableScrollArgs = {
  id: DroppableId,
  offset: Position,
};

export type UpdateDroppableScrollAction = {|
  type: 'UPDATE_DROPPABLE_SCROLL',
  payload: UpdateDroppableScrollArgs,
|};

export const updateDroppableScroll = (
  args: UpdateDroppableScrollArgs,
): UpdateDroppableScrollAction => ({
  type: 'UPDATE_DROPPABLE_SCROLL',
  payload: args,
});

export type UpdateDroppableIsEnabledArgs = {|
  id: DroppableId,
  isEnabled: boolean,
|};

export type UpdateDroppableIsEnabledAction = {|
  type: 'UPDATE_DROPPABLE_IS_ENABLED',
  payload: UpdateDroppableIsEnabledArgs,
|};

export const updateDroppableIsEnabled = (
  args: UpdateDroppableIsEnabledArgs,
): UpdateDroppableIsEnabledAction => ({
  type: 'UPDATE_DROPPABLE_IS_ENABLED',
  payload: args,
});

export type MoveArgs = {|
  // TODO: clientSelection
  client: Position,
  shouldAnimate: boolean,
|};

export type MoveAction = {|
  type: 'MOVE',
  payload: MoveArgs,
|};

export const move = (args: MoveArgs): MoveAction => ({
  type: 'MOVE',
  payload: args,
});

type MoveByWindowScrollArgs = {|
  scroll: Position,
|};

export type MoveByWindowScrollAction = {|
  type: 'MOVE_BY_WINDOW_SCROLL',
  payload: MoveByWindowScrollArgs,
|};

export const moveByWindowScroll = (
  args: MoveByWindowScrollArgs,
): MoveByWindowScrollAction => ({
  type: 'MOVE_BY_WINDOW_SCROLL',
  payload: args,
});

type UpdateViewportMaxScrollAction = {|
  type: 'UPDATE_VIEWPORT_MAX_SCROLL',
  payload: Position,
|};

export const updateViewportMaxScroll = (
  max: Position,
): UpdateViewportMaxScrollAction => ({
  type: 'UPDATE_VIEWPORT_MAX_SCROLL',
  payload: max,
});

export type MoveUpAction = {|
  type: 'MOVE_UP',
  payload: null,
|};

export const moveUp = (): MoveUpAction => ({
  type: 'MOVE_UP',
  payload: null,
});

export type MoveDownAction = {|
  type: 'MOVE_DOWN',
  payload: null,
|};

export const moveDown = (): MoveDownAction => ({
  type: 'MOVE_DOWN',
  payload: null,
});

export type MoveRightAction = {|
  type: 'MOVE_RIGHT',
  payload: null,
|};

export const moveRight = (): MoveRightAction => ({
  type: 'MOVE_RIGHT',
  payload: null,
});

export type MoveLeftAction = {|
  type: 'MOVE_LEFT',
  payload: null,
|};

export const moveLeft = (): MoveLeftAction => ({
  type: 'MOVE_LEFT',
  payload: null,
});

type CleanAction = {|
  type: 'CLEAN',
  payload: null,
|};

export const clean = (): CleanAction => ({
  type: 'CLEAN',
  payload: null,
});

type PrepareAction = {|
  type: 'PREPARE',
  payload: null,
|};

export const prepare = (): PrepareAction => ({
  type: 'PREPARE',
  payload: null,
});

export type DropAnimateAction = {
  type: 'DROP_ANIMATE',
  payload: PendingDrop,
};

export const animateDrop = (pending: PendingDrop): DropAnimateAction => ({
  type: 'DROP_ANIMATE',
  payload: pending,
});

export type DropCompleteAction = {
  type: 'DROP_COMPLETE',
  payload: DropResult,
};

export const completeDrop = (result: DropResult): DropCompleteAction => ({
  type: 'DROP_COMPLETE',
  payload: result,
});

type DropArgs = {|
  reason: DropReason,
|};

export type DropAction = {|
  type: 'DROP',
  payload: DropArgs,
|};

export const drop = (args: DropArgs) => ({
  type: 'DROP',
  payload: args,
});

export type DropPendingAction = {|
  type: 'DROP_PENDING',
  payload: DropArgs,
|};

export const dropPending = (args: DropArgs): DropPendingAction => ({
  type: 'DROP_PENDING',
  payload: args,
});

export type DropAnimationFinishedAction = {|
  type: 'DROP_ANIMATION_FINISHED',
  payload: null,
|};

export const dropAnimationFinished = (): DropAnimationFinishedAction => ({
  type: 'DROP_ANIMATION_FINISHED',
  payload: null,
});

export type Action =
  | LiftAction
  | InitialPublishAction
  | PublishAction
  | CollectionStartingAction
  | UpdateDroppableScrollAction
  | UpdateDroppableIsEnabledAction
  | MoveByWindowScrollAction
  | UpdateViewportMaxScrollAction
  | MoveAction
  | MoveUpAction
  | MoveDownAction
  | MoveRightAction
  | MoveLeftAction
  | DropPendingAction
  | DropAction
  | DropAnimateAction
  | DropAnimationFinishedAction
  | DropCompleteAction
  | PrepareAction
  | CleanAction;
