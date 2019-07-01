// @flow
import type { Position } from 'css-box-model';
import { horizontal, vertical } from '../../../../../../src/state/axis';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import getLiftEffect from '../../../../../../src/state/get-lift-effect';
import { patch, add } from '../../../../../../src/state/position';
import { forward } from '../../../../../../src/state/user-direction/user-direction-preset';
import { getPreset } from '../../../../../utils/dimension';
import type {
  Axis,
  DragImpact,
  Viewport,
  DisplacedBy,
} from '../../../../../../src/types';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    it('should allow movement past the last item', () => {
      const preset = getPreset(axis);
      const viewport: Viewport = preset.viewport;
      const { onLift, impact: homeImpact } = getHomeOnLift({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome1.displaceBy,
      );
      const startOfInForeign4: Position = patch(
        axis.line,
        preset.inForeign4.page.borderBox[axis.start],
        preset.foreign.page.borderBox.center[axis.crossAxisLine],
      );
      const displacedStartOfInForeign4: Position = add(
        startOfInForeign4,
        displacedBy.point,
      );

      const goingForwards: DragImpact = getDragImpact({
        pageBorderBoxCenter: displacedStartOfInForeign4,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: homeImpact,
        viewport,
        userDirection: forward,
        onLift,
      });

      const expected: DragImpact = {
        movement: {
          displaced: [],
          map: {},
          displacedBy,
        },
        // after last item
        destination: {
          index: preset.inForeign4.descriptor.index + 1,
          droppableId: preset.inForeign4.descriptor.droppableId,
        },
        merge: null,
      };
      expect(goingForwards).toEqual(expected);
    });
  });
});
