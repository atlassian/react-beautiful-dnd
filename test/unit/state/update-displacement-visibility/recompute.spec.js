// @flow
import type {
  DisplacedBy,
  Axis,
  Displacement,
  DragImpact,
} from '../../../../src/types';
import { getPreset } from '../../../utils/dimension';
import getNotAnimatedDisplacement from '../../../utils/get-displacement/get-not-animated-displacement';
import getNotVisibleDisplacement from '../../../utils/get-displacement/get-not-visible-displacement';
import getVisibleDisplacement from '../../../utils/get-displacement/get-visible-displacement';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../src/state/get-displacement-map';
import getLiftEffect from '../../../../src/state/get-lift-effect';
import recompute from '../../../../src/state/update-displacement-visibility/recompute';
import { horizontal, vertical } from '../../../../src/state/axis';

[horizontal, vertical].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    // moving inHome1 down past inHome2 and inHome3
    const { onLift } = getHomeOnLift({
      draggable: preset.inHome1,
      draggables: preset.draggables,
      viewport: preset.viewport,
      home: preset.home,
    });
    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome1.displaceBy,
    );
    const initial: Displacement[] = [
      // pretending the displacement is not visible
      getNotVisibleDisplacement(preset.inHome2),
      getNotVisibleDisplacement(preset.inHome3),
    ];
    const impact: DragImpact = {
      movement: {
        displacedBy,
        displaced: initial,
        map: getDisplacementMap(initial),
      },
      merge: null,
      destination: {
        droppableId: preset.home.descriptor.id,
        index: preset.inHome3.descriptor.index,
      },
    };

    it('should recompute a displacement', () => {
      const recomputed: DragImpact = recompute({
        impact,
        viewport: preset.viewport,
        destination: preset.home,
        draggables: preset.draggables,
        onLift,
      });

      const displaced: Displacement[] = [
        // visibility recalculated
        getNotAnimatedDisplacement(preset.inHome2),
        getNotAnimatedDisplacement(preset.inHome3),
      ];
      const expected: DragImpact = {
        ...impact,
        movement: {
          displacedBy,
          displaced,
          map: getDisplacementMap(displaced),
        },
      };
      expect(recomputed).toEqual(expected);
    });

    it('should allow the displacement animation to be forced', () => {
      const recomputed: DragImpact = recompute({
        impact,
        viewport: preset.viewport,
        destination: preset.home,
        draggables: preset.draggables,
        onLift,
        forceShouldAnimate: true,
      });

      const displaced: Displacement[] = [
        // visibility recalculated
        // forced animation
        getVisibleDisplacement(preset.inHome2),
        getVisibleDisplacement(preset.inHome3),
      ];
      const expected: DragImpact = {
        ...impact,
        movement: {
          displacedBy,
          displaced,
          map: getDisplacementMap(displaced),
        },
      };
      expect(recomputed).toEqual(expected);
    });
  });
});
