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
import { patch } from '../../../../../../src/state/position';
import { backward } from '../../../../../../src/state/user-direction/user-direction-preset';
import { getPreset } from '../../../../../util/dimension';
import { emptyGroups } from '../../../../../../src/state/no-impact';
import { getForcedDisplacement } from '../../../../../util/impact';

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
      const endOfInForeign4: Position = patch(
        axis.line,
        preset.inForeign4.page.borderBox[axis.end],
        preset.foreign.page.borderBox.center[axis.crossAxisLine],
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

      const goingBackwards: DragImpact = getDragImpact({
        pageBorderBoxCenter: endOfInForeign4,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: inLastSpot,
        viewport,
        userDirection: backward,
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
