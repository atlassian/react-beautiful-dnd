// @flow
import type { Position } from 'css-box-model';
import type { Axis, DragImpact, Viewport } from '../../../../../../src/types';
import { horizontal, vertical } from '../../../../../../src/state/axis';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import getLiftEffect from '../../../../../../src/state/get-lift-effect';
import { getPreset } from '../../../../../util/dimension';
import { emptyGroups } from '../../../../../../src/state/no-impact';
import afterPoint from '../../../../../util/after-point';
import { getOffsetForEndEdge } from '../../util/get-offset-for-edge';

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
      const offsetForEndOnInHome4Center: Position = getOffsetForEndEdge({
        endEdgeOn: preset.inHome4.page.borderBox.center,
        dragging: preset.inHome1.page.borderBox,
        axis,
      });

      const goingForwards: DragImpact = getDragImpact({
        pageOffset: afterPoint(axis, offsetForEndOnInHome4Center),
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: homeImpact,
        viewport,
        afterCritical,
      });

      const expected: DragImpact = {
        displaced: emptyGroups,
        displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
        at: {
          type: 'REORDER',
          // in the visual position of the last itme
          destination: {
            index: preset.inHome4.descriptor.index,
            droppableId: preset.inHome4.descriptor.droppableId,
          },
        },
      };
      expect(goingForwards).toEqual(expected);
    });
  });
});
