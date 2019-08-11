// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  DroppableDimensionMap,
} from '../../../../../src/types';
import { horizontal, vertical } from '../../../../../src/state/axis';
import getDisplacedBy from '../../../../../src/state/get-displaced-by';
import getDragImpact from '../../../../../src/state/get-drag-impact';
import getLiftEffect from '../../../../../src/state/get-lift-effect';
import { patch } from '../../../../../src/state/position';
import { forward } from '../../../../../src/state/user-direction/user-direction-preset';
import beforePoint from '../../../../util/before-point';
import { enableCombining, getPreset } from '../../../../util/dimension';
import { getForcedDisplacement } from '../../../../util/impact';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    const { afterCritical, impact: homeImpact } = getLiftEffect({
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
          afterCritical,
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
          afterCritical,
        });

        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [
              // displaced is not animated as it was the starting displacement
              { dimension: preset.inHome3, shouldAnimate: false },
              { dimension: preset.inHome4, shouldAnimate: false },
            ],
          }),
          displacedBy: getDisplacedBy(axis, preset.inHome2.displaceBy),
          at: {
            type: 'COMBINE',
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
