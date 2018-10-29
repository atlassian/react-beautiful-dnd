// @flow
import type {
  DisplacedBy,
  Axis,
  Displacement,
  DragImpact,
} from '../../../../src/types';
import { getPreset } from '../../../utils/dimension';
import getNotVisibleDisplacement from '../../../utils/get-not-visible-displacement';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../src/state/get-displacement-map';
import recompute from '../../../../src/state/update-displacement-visibility/recompute';
import { horizontal, vertical } from '../../../../src/state/axis';

const preset = getPreset();

[horizontal, vertical].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    it('should recompute a displacement', () => {
      // moving inHome1 down past inHome2 and inHome3

      const willDisplaceForward: boolean = false;
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome1.displaceBy,
        willDisplaceForward,
      );
      const initial: Displacement[] = [
        getNotVisibleDisplacement(preset.inHome3),
        getNotVisibleDisplacement(preset.inHome2),
      ];
      const impact: DragImpact = {
        movement: {
          willDisplaceForward,
          displacedBy,
          displaced: initial,
          map: getDisplacementMap(initial),
        },
        direction: axis.direction,
        merge: null,
        destination: {
          droppableId: preset.home.descriptor.id,
          index: preset.inHome3.descriptor.index,
        },
      };

      const recomputed: DragImpact = recompute({
        impact,
        viewport: preset.viewport,
        destination: preset.home,
        draggables: preset.draggables,
      });

      const displaced: Displacement[] = [
        {
          draggableId: preset.inHome3.descriptor.id,
          // was previously not visible so will not animate
          shouldAnimate: false,
          isVisible: true,
        },
        {
          draggableId: preset.inHome2.descriptor.id,
          shouldAnimate: false,
          isVisible: true,
        },
      ];
      const expected: DragImpact = {
        ...impact,
        movement: {
          willDisplaceForward,
          displacedBy,
          displaced,
          map: getDisplacementMap(displaced),
        },
      };
      expect(recomputed).toEqual(expected);
    });
  });
});
