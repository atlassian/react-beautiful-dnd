// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  Viewport,
  DisplacedBy,
} from '../../../../../../src/types';
import { horizontal, vertical } from '../../../../../../src/state/axis';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import getLiftEffect from '../../../../../../src/state/get-lift-effect';
import { getPreset } from '../../../../../util/dimension';
import { emptyGroups } from '../../../../../../src/state/no-impact';
import { getCenterForStartEdge } from '../../util/get-edge-from-center';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    it('should allow movement past the last item', () => {
      const preset = getPreset(axis);
      const viewport: Viewport = preset.viewport;
      const { afterCritical, impact: homeImpact } = getLiftEffect({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome1.displaceBy,
      );

      const centerForStartOnInForeign4Center: Position = getCenterForStartEdge({
        startEdgeOn: preset.inForeign4.page.borderBox.center,
        dragging: preset.inHome1.page.borderBox,
        axis,
      });

      const goingForwards: DragImpact = getDragImpact({
        // because this is a new impact - nothing is previously displaced
        // targetStart < childCenter;
        pageBorderBoxCenter: centerForStartOnInForeign4Center,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: homeImpact,
        viewport,
        afterCritical,
      });

      const expected: DragImpact = {
        displaced: emptyGroups,
        displacedBy,
        at: {
          type: 'REORDER',
          // after last item
          destination: {
            index: preset.inForeign4.descriptor.index + 1,
            droppableId: preset.inForeign4.descriptor.droppableId,
          },
        },
      };
      expect(goingForwards).toEqual(expected);
    });
  });
});
