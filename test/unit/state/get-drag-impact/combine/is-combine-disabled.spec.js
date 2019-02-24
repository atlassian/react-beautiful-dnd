// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  DroppableDimensionMap,
  Displacement,
} from '../../../../../src/types';
import { horizontal, vertical } from '../../../../../src/state/axis';
import getDisplacedBy from '../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../src/state/get-displacement-map';
import getDragImpact from '../../../../../src/state/get-drag-impact';
import getHomeOnLift from '../../../../../src/state/get-home-on-lift';
import { patch } from '../../../../../src/state/position';
import { forward } from '../../../../../src/state/user-direction/user-direction-preset';
import beforePoint from '../../../../utils/before-point';
import { enableCombining, getPreset } from '../../../../utils/dimension';
import getNotAnimatedDisplacement from '../../../../utils/get-displacement/get-not-animated-displacement';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    const { onLift, impact: homeImpact } = getHomeOnLift({
      draggable: preset.inHome2,
      home: preset.home,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });
    const withCombineEnabled: DroppableDimensionMap = enableCombining(
      preset.droppables,
    );
    const crossAxisCenter: number =
      preset.home.page.borderBox.center[axis.crossAxisLine];
    const startOfInHome3: Position = patch(
      axis.line,
      preset.inHome3.page.borderBox[axis.start],
      crossAxisCenter,
    );

    it('should not create a combine impact when combining is disabled', () => {
      // does not combine when combine is disabled
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforePoint(startOfInHome3, axis),
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          userDirection: forward,
          onLift,
        });

        expect(impact).toEqual(homeImpact);
      }
      // would have combined if was enabled (validation)
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: startOfInHome3,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          userDirection: forward,
          onLift,
        });

        const displaced: Displacement[] = [
          // displaced is not animated as it was the starting displacement
          getNotAnimatedDisplacement(preset.inHome3),
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy: getDisplacedBy(axis, preset.inHome2.displaceBy),
          },
          destination: null,
          merge: {
            whenEntered: forward,
            combine: {
              draggableId: preset.inHome3.descriptor.id,
              droppableId: preset.inHome3.descriptor.droppableId,
            },
          },
        };
        expect(impact).toEqual(expected);
      }
    });
  });
});
