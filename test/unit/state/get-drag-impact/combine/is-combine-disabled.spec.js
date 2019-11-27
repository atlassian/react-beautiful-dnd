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
import { patch, add } from '../../../../../src/state/position';
import afterPoint from '../../../../util/after-point';
import { enableCombining, getPreset } from '../../../../util/dimension';
import { getForcedDisplacement } from '../../../../util/impact';
import { getThreshold } from './util';
import { getCenterForEndEdge } from '../util/get-edge-from-center';

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
    const startOfInHome3: Position = patch(
      axis.line,
      preset.inHome3.page.borderBox[axis.start],
      preset.inHome3.page.borderBox.center[axis.crossAxisLine],
    );
    const threshold: Position = getThreshold(axis, preset.inHome3);
    const combineStart: Position = getCenterForEndEdge({
      endEdgeOn: add(startOfInHome3, threshold),
      dragging: preset.inHome2.page.borderBox,
      axis,
    });

    it('should not create a combine impact when combining is disabled', () => {
      // does not combine when combine is disabled
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: afterPoint(axis, combineStart),
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          afterCritical,
        });

        expect(impact).toEqual(homeImpact);
      }
      // would have combined if was enabled (validation)
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: afterPoint(axis, combineStart),
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
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
