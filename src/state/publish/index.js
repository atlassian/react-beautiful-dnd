// @flow

import type {
  DragImpact,
  DimensionMap,
  DraggingState,
  CollectingState,
  DropPendingState,
  Publish,
  Critical,
  DraggableId,
  DraggableDimension,
} from '../../types';
import getDragImpact from '../get-drag-impact';
import getHomeImpact from '../get-home-impact';
import getDimensionMap from './get-dimension-map';
import getDragPositions from './get-drag-positions';

type Args = {|
  state: CollectingState | DropPendingState,
  publish: Publish
|}

export default ({
  state,
  publish,
}: Args): DraggingState | DropPendingState => {
  // TODO: write validate that every removed draggable must have a removed droppable

  // ## Adding Draggables to existing lists
  // Added dimension is already in the correct location
  // If added to the end of the list then everything else is in the correct spot
  // If inserted within the list then everything else in the list has been pushed forward
  // by the size of the addition
  // If inserted before the critical draggable then everything initial and current DragPositions
  // need to be updated.

  // ## Removing Draggables from existing lists
  // Added dimension is already in the correct location
  // If removed from the end of the list - nothing to do
  // If removed from within a list then everything else is pulled forward
  // If removed before critical dimension then DragPositions need to be updated

  // ## Adding a new droppable
  // Addition already in right spot

  // ## Adding a Draggable to a new Droppable
  // Addition already in right spot

  const dimensions: DimensionMap = getDimensionMap({
    existing: state.dimensions,
    publish,
    // TODO: fix
    windowScroll: state.viewport.scroll.initial,
  });

  const dragging: DraggableId = state.critical.draggable.id;
  const original: DraggableDimension = state.dimensions.draggables[dragging];
  const updated: DraggableDimension = dimensions.draggables[dragging];

  const critical: Critical = {
    droppable: state.critical.droppable,
    // draggable index can change during a drag
    draggable: updated.descriptor,
  };

  const { initial, current } = getDragPositions({
    initial: state.initial,
    current: state.current,
    oldClientBorderBoxCenter: original.client.borderBox.center,
    newClientBorderBoxCenter: updated.client.borderBox.center,
    viewport: state.viewport,
  });

  const impact: DragImpact = getDragImpact({
    pageBorderBoxCenter: current.page.borderBoxCenter,
    draggable: dimensions.draggables[state.critical.draggable.id],
    draggables: dimensions.draggables,
    droppables: dimensions.droppables,
    previousImpact: getHomeImpact(state.critical, dimensions),
    viewport: state.viewport,
  });

  const draggingState: DraggingState = {
    // appeasing flow
    phase: 'DRAGGING',
    ...state,
    // eslint-disable-next-line
    phase: 'DRAGGING',
    critical,
    current,
    initial,
    impact,
    dimensions,
    // not animating this movement
    shouldAnimate: false,
  };

  if (state.phase === 'COLLECTING') {
    return draggingState;
  }

  // There was a DROP_PENDING
  // Staying in the DROP_PENDING phase
  // setting isWaiting for false

  const dropPending: DropPendingState = {
    // appeasing flow
    phase: 'DROP_PENDING',
    ...draggingState,
    // eslint-disable-next-line
    phase: 'DROP_PENDING',
    // No longer waiting
    reason: state.reason,
    isWaiting: false,
  };

  return dropPending;
};

