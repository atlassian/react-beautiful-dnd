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
import { getForcedDisplacement } from '../../../../../util/impact';
import { getCenterForStartEdge } from '../../util/get-edge-from-center';
import beforePoint from '../../../../../util/before-point';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    it('should allow movement past from last item', () => {
      const preset = getPreset(axis);
      const viewport: Viewport = preset.viewport;
      const { afterCritical } = getLiftEffect({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome1.displaceBy,
      );

      const inLastSpot: DragImpact = {
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

      const centerForEndOnInForeign4Center: Position = getCenterForStartEdge({
        startEdgeOn: preset.inForeign4.page.borderBox.center,
        dragging: preset.inHome1.page.borderBox,
        axis,
      });

      const goingBackwards: DragImpact = getDragImpact({
        pageBorderBoxCenter: beforePoint(axis, centerForEndOnInForeign4Center),
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: inLastSpot,
        viewport,
        afterCritical,
      });

      const expected: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [{ dimension: preset.inForeign4 }],
        }),
        displacedBy,
        at: {
          type: 'REORDER',
          // now in visual spot of inForeign4
          destination: {
            index: preset.inForeign4.descriptor.index,
            droppableId: preset.inForeign4.descriptor.droppableId,
          },
        },
      };
      expect(goingBackwards).toEqual(expected);
    });
  });
});
