// @flow
import type {
  DragImpact,
  DragMovement,
} from '../types';

export default (impact: DragImpact, displacementLimit: number): DragImpact => {
  // need to trim impact
  if (!impact.destination) {
    return impact;
  }

  if (!impact.movement.draggables.length) {
    return impact;
  }

  const trimmed: DragMovement = {
    // cutting the impacted items
    // TEMP: no trimming
    draggables: impact.movement.draggables,
    // unmodified
    amount: impact.movement.amount,
    isBeyondStartPosition: impact.movement.isBeyondStartPosition,
  };

  const withTrimmed: DragImpact = {
    movement: trimmed,
    // unmodified
    direction: impact.direction,
    destination: impact.destination,
  };

  return withTrimmed;
};
