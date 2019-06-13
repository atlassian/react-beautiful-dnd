// @flow
import type {
  DropReason,
  DragImpact,
  Viewport,
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  LiftEffect,
  UserDirection,
} from '../../../types';
import recompute from '../../update-displacement-visibility/recompute';
import { emptyGroups } from '../../no-impact';

type Args = {|
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  home: DroppableDimension,
  reason: DropReason,
  lastImpact: DragImpact,
  onLiftImpact: DragImpact,
  viewport: Viewport,
  userDirection: UserDirection,
  afterCritical: LiftEffect,
|};

export type Result = {|
  impact: DragImpact,
  didDropInsideDroppable: boolean,
|};

export default ({
  draggable,
  draggables,
  reason,
  lastImpact,
  home,
  viewport,
  onLiftImpact,
  userDirection,
}: Args): Result => {
  if (!lastImpact.at || reason !== 'DROP') {
    // Dropping outside of a list or the drag was cancelled

    // Going to use the on lift impact
    // Need to recompute the visibility of the original impact
    // What is visible can be different to when  the drag started

    const recomputedHomeImpact: DragImpact = recompute({
      draggable,
      draggables,
      impact: onLiftImpact,
      destination: home,
      viewport,
      userDirection,
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
