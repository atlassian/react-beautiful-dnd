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
import { tryGetDestination } from '../../get-impact-location';
import { emptyGroups } from '../../no-impact';

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
  if (!lastImpact.at || reason !== 'DROP') {
    // Dropping outside of a list or the drag was cancelled

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
      didDropInsideDroppable: false,
    };
  }

  // use the existing impact
  if (lastImpact.at.type === 'REORDER') {
    return {
      impact: lastImpact,
      didDropInsideDroppable: true,
    };
  }

  // When merging we remove the movement so that everything
  // will animate closed
  const withoutMovement: DragImpact = {
    ...lastImpact,
    displaced: emptyGroups,
  };

  return {
    impact: withoutMovement,
    didDropInsideDroppable: true,
  };
};
