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

export type Result = {|
  impact: DragImpact,
  didDropInsideDroppable: boolean,
|};

export default ({
  reason,
  lastImpact,
  home,
  viewport,
  draggables,
  onLiftImpact,
  onLift,
}: Args): Result => {
  const didDropInsideDroppable: boolean =
    reason === 'DROP' && Boolean(whatIsDraggedOver(lastImpact));

  if (didDropInsideDroppable) {
    return {
      impact: lastImpact,
      didDropInsideDroppable,
    };
  }

  // Going to use the on lift impact
  // Need to recompute the visibility of the original impact
  // What is visible can be different to when  the drag started
  const impact: DragImpact = recompute({
    impact: onLiftImpact,
    destination: home,
    viewport,
    draggables,
    onLift,
    // We need the draggables to animate back to their positions
    forceShouldAnimate: true,
  });

  return {
    impact,
    didDropInsideDroppable,
  };
};
