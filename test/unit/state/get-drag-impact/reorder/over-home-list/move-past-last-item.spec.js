// @flow
import type { Position } from 'css-box-model';
import { horizontal, vertical } from '../../../../../../src/state/axis';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import getHomeOnLift from '../../../../../../src/state/get-home-on-lift';
import { patch } from '../../../../../../src/state/position';
import { forward } from '../../../../../../src/state/user-direction/user-direction-preset';
import { getPreset } from '../../../../../utils/dimension';
import type { Axis, DragImpact, Viewport } from '../../../../../../src/types';

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
        onLift,
      });

      const expected: DragImpact = {
        movement: {
          displaced: [],
          map: {},
          displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
        },
        // in the visual position of the last itme
        destination: {
          index: preset.inHome4.descriptor.index,
          droppableId: preset.inHome4.descriptor.droppableId,
        },
        merge: null,
      };
      expect(goingForwards).toEqual(expected);
    });
  });
});
