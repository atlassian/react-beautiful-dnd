// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  Viewport,
  DisplacedBy,
  Displacement,
} from '../../../../../../src/types';
import { horizontal, vertical } from '../../../../../../src/state/axis';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import getHomeOnLift from '../../../../../../src/state/get-home-on-lift';
import { patch } from '../../../../../../src/state/position';
import { backward } from '../../../../../../src/state/user-direction/user-direction-preset';
import { getPreset } from '../../../../../utils/dimension';
import getVisibleDisplacement from '../../../../../utils/get-displacement/get-visible-displacement';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    it('should allow movement past from last item', () => {
      const preset = getPreset(axis);
      const viewport: Viewport = preset.viewport;
      const { onLift } = getHomeOnLift({
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

      const goingBackwards: DragImpact = getDragImpact({
        pageBorderBoxCenter: endOfInForeign4,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: inLastSpot,
        viewport,
        userDirection: backward,
        onLift,
      });

      const displaced: Displacement[] = [
        getVisibleDisplacement(preset.inForeign4),
      ];
      const expected: DragImpact = {
        movement: {
          displacedBy,
          displaced,
          map: getDisplacementMap(displaced),
        },
        // now in visual spot of inForeign4
        destination: {
          index: preset.inForeign4.descriptor.index,
          droppableId: preset.inForeign4.descriptor.droppableId,
        },
        merge: null,
      };
      expect(goingBackwards).toEqual(expected);
    });
  });
});
