// @flow
import type { DisplacedBy, Axis, DragImpact } from '../../../../src/types';
import { getPreset } from '../../../util/dimension';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import recompute from '../../../../src/state/update-displacement-visibility/recompute';
import { horizontal, vertical } from '../../../../src/state/axis';
import { getForcedDisplacement } from '../../../util/impact';

[horizontal, vertical].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome1.displaceBy,
    );
    // moving inHome1 down past inHome2 and inHome3
    const impact: DragImpact = {
      displaced: getForcedDisplacement({
        // pretending the displacement is not visible
        invisible: [preset.inHome2, preset.inHome3],
      }),
      displacedBy,
      at: {
        type: 'REORDER',
        destination: {
          droppableId: preset.home.descriptor.id,
          index: preset.inHome3.descriptor.index,
        },
      },
    };

    it('should recompute a displacement', () => {
      const recomputed: DragImpact = recompute({
        impact,
        viewport: preset.viewport,
        destination: preset.home,
        draggables: preset.draggables,
      });

      const expected: DragImpact = {
        ...impact,
        displaced: getForcedDisplacement({
          // visibility recalculated
          visible: [
            // not animated as previously invisible
            { dimension: preset.inHome2, shouldAnimate: false },
            { dimension: preset.inHome3, shouldAnimate: false },
          ],
        }),
      };
      expect(recomputed).toEqual(expected);
    });

    it('should allow the displacement animation to be forced', () => {
      const recomputed: DragImpact = recompute({
        impact,
        viewport: preset.viewport,
        destination: preset.home,
        draggables: preset.draggables,
        forceShouldAnimate: true,
      });

      const expected: DragImpact = {
        ...impact,
        displaced: getForcedDisplacement({
          // visibility recalculated
          visible: [
            // forced animation
            { dimension: preset.inHome2, shouldAnimate: true },
            { dimension: preset.inHome3, shouldAnimate: true },
          ],
        }),
      };
      expect(recomputed).toEqual(expected);
    });
  });
});
