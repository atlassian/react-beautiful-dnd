// @flow
import type { DragImpact, Displacement } from '../../types';

export default (impact: DragImpact): DragImpact => {
  const displaced: Displacement[] = impact.movement.displaced;
  // nothing is displaced - we don't need to update anything
  if (!displaced.length) {
    return impact;
  }

  const withoutAnimation: Displacement[] = displaced.map(
    (displacement: Displacement): Displacement => {
      // Already do not need to animate it - can return as is
      if (!displacement.shouldAnimate) {
        return displacement;
      }

      // Need to disable the animation
      return {
        ...displacement,
        shouldAnimate: false,
      };
    },
  );

  const result: DragImpact = {
    ...impact,
    movement: {
      ...impact.movement,
      displaced: withoutAnimation,
    },
  };

  return result;
};
