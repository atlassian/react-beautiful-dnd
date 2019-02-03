// @flow
import type {
  DropReason,
  DragImpact,
  Viewport,
  DroppableDimension,
  DraggableDimensionMap,
  OnLift,
} from '../../../types';
import whatIsDraggedOver from '../../droppable/what-is-dragged-over';
import recompute from '../../update-displacement-visibility/recompute';

type Args = {|
  reason: DropReason,
  lastImpact: DragImpact,
  onLiftImpact: DragImpact,
  viewport: Viewport,
  home: DroppableDimension,
  draggables: DraggableDimensionMap,
  onLift: OnLift,
|};

export default ({
  reason,
  lastImpact,
  home,
  viewport,
  draggables,
  onLiftImpact,
  onLift,
}: Args): DragImpact => {
  const canUseLast: boolean =
    reason === 'DROP' && Boolean(whatIsDraggedOver(lastImpact));

  if (canUseLast) {
    return lastImpact;
  }

  // Need to recompute the visibility of the original impact
  // What is visible can be different to when  the drag started
  // TODO: need to clear destination / merge for responder but keep it for isOver
  return recompute({
    impact: onLiftImpact,
    destination: home,
    viewport,
    draggables,
    onLift,
    // We need the draggables to animate back to their positions
    forceShouldAnimate: true,
  });
};
