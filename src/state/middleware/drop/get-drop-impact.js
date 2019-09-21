// @flow
import type {
  DropReason,
  DragImpact,
  Viewport,
  DroppableDimension,
  DraggableDimensionMap,
  LiftEffect,
} from '../../../types';
import recompute from '../../update-displacement-visibility/recompute';
import { emptyGroups } from '../../no-impact';

type Args = {|
  draggables: DraggableDimensionMap,
  home: DroppableDimension,
  reason: DropReason,
  lastImpact: DragImpact,
  onLiftImpact: DragImpact,
  viewport: Viewport,
  afterCritical: LiftEffect,
|};

export type Result = {|
  impact: DragImpact,
  didDropInsideDroppable: boolean,
|};

export default ({
  draggables,
  reason,
  lastImpact,
  home,
  viewport,
  onLiftImpact,
}: Args): Result => {
  if (!lastImpact.at || reason !== 'DROP') {
    // Dropping outside of a list or the drag was cancelled

    // Going to use the on lift impact
    // Need to recompute the visibility of the original impact
    // What is visible can be different to when  the drag started

    const recomputedHomeImpact: DragImpact = recompute({
      draggables,
      impact: onLiftImpact,
      destination: home,
      viewport,
      // We need the draggables to animate back to their positions
      forceShouldAnimate: true,
    });

    return {
      impact: recomputedHomeImpact,
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
