// @flow
import type { Position } from 'css-box-model';
import type { Axis, DragImpact, Viewport } from '../../../../../../src/types';
import { horizontal, vertical } from '../../../../../../src/state/axis';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import getLiftEffect from '../../../../../../src/state/get-lift-effect';
import { patch } from '../../../../../../src/state/position';
import { forward } from '../../../../../../src/state/user-direction/user-direction-preset';
import { getPreset } from '../../../../../util/dimension';
import { emptyGroups } from '../../../../../../src/state/no-impact';

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
      const startOfInHome4: Position = patch(
        axis.line,
        preset.inHome4.page.borderBox[axis.start],
        preset.home.page.borderBox.center[axis.crossAxisLine],
      );

      const goingForwards: DragImpact = getDragImpact({
        pageBorderBoxCenter: startOfInHome4,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: homeImpact,
        viewport,
        userDirection: forward,
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
