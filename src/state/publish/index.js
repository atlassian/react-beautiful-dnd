// @flow
import type {
  DragImpact,
  DimensionMap,
  DraggingState,
  CollectingState,
  DropPendingState,
  Publish,
} from '../../types';
import getDragImpact from '../get-drag-impact';
import getHomeImpact from '../get-home-impact';

type Args = {|
  state: CollectingState | DropPendingState,
  publish: Publish
|}

export default ({
  state,
  publish,
}: Args): DraggingState | DropPendingState => {
  // TODO: everything
  const additions: DimensionMap = publish.additions;
  // const removals = publish.removals;

  const dimensions: DimensionMap = {
    draggables: {
      ...state.dimensions.draggables,
      ...additions.draggables,
    },
    droppables: {
      ...state.dimensions.droppables,
      ...additions.droppables,
    },
  };

  const impact: DragImpact = getDragImpact({
    pageBorderBoxCenter: state.current.page.borderBoxCenter,
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
    impact,
    dimensions,
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

