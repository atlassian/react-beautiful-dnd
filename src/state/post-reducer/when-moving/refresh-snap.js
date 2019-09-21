// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  DraggableDimension,
  StateWhenUpdatesAllowed,
  DroppableId,
  DimensionMap,
  DragImpact,
  Viewport,
} from '../../../types';
import whatIsDraggedOver from '../../droppable/what-is-dragged-over';
import recomputeDisplacementVisibility from '../../update-displacement-visibility/recompute';
import getClientBorderBoxCenter from '../../get-center-from-impact/get-client-border-box-center';
import update from './update';

type Args = {|
  state: StateWhenUpdatesAllowed,
  dimensions?: DimensionMap,
  viewport?: Viewport,
|};

export default ({
  state,
  dimensions: forcedDimensions,
  viewport: forcedViewport,
}: // when a draggable is changing enabled state, sometimes it needs to force refresh an impact
Args): StateWhenUpdatesAllowed => {
  invariant(state.movementMode === 'SNAP');

  const needsVisibilityCheck: DragImpact = state.impact;
  const viewport: Viewport = forcedViewport || state.viewport;
  const dimensions: DimensionMap = forcedDimensions || state.dimensions;
  const { draggables, droppables } = dimensions;

  const draggable: DraggableDimension = draggables[state.critical.draggable.id];
  const isOver: ?DroppableId = whatIsDraggedOver(needsVisibilityCheck);
  invariant(isOver, 'Must be over a destination in SNAP movement mode');
  const destination: DroppableDimension = droppables[isOver];

  const impact: DragImpact = recomputeDisplacementVisibility({
    impact: needsVisibilityCheck,
    viewport,
    destination,
    draggables,
  });

  const clientSelection: Position = getClientBorderBoxCenter({
    impact,
    draggable,
    droppable: destination,
    draggables,
    viewport,
    afterCritical: state.afterCritical,
  });

  return update({
    // new
    impact,
    clientSelection,
    // pass through
    state,
    dimensions,
    viewport,
  });
};
