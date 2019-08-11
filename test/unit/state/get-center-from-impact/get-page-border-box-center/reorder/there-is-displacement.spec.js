// @flow
import type { Position } from 'css-box-model';
import { offset } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  DisplacedBy,
} from '../../../../../../src/types';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import getPageBorderBoxCenter from '../../../../../../src/state/get-center-from-impact/get-page-border-box-center';
import getLiftEffect from '../../../../../../src/state/get-lift-effect';
import { getPreset } from '../../../../../util/dimension';
import { goBefore } from '../../../../../../src/state/get-center-from-impact/move-relative-to';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import { getForcedDisplacement } from '../../../../../util/impact';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    describe('closest displaced started displaced', () => {
      it('should go before the visible (displaced) position of the item', () => {
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

        const impact: DragImpact = {
          // moved forward over inHome2
          displaced: getForcedDisplacement({
            visible: [
              {
                dimension: preset.inHome3,
                shouldAnimate: false,
              },
              {
                dimension: preset.inHome4,
                shouldAnimate: false,
              },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              index: preset.inHome3.descriptor.index,
              droppableId: preset.inHome3.descriptor.id,
            },
          },
        };
        const result: Position = getPageBorderBoxCenter({
          impact,
          afterCritical,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppable: preset.home,
        });

        const expected: Position = goBefore({
          axis,
          moveRelativeTo: preset.inHome3.page,
          isMoving: preset.inHome1.page,
        });
        expect(result).toEqual(expected);
      });
    });

    describe('closest displaced did not start displaced', () => {
      it('should go before the displaced position of the item', () => {
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
        // moved into foreign
        const impact: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [
              {
                dimension: preset.inForeign2,
                shouldAnimate: false,
              },
              {
                dimension: preset.inForeign3,
                shouldAnimate: false,
              },
              {
                dimension: preset.inForeign4,
                shouldAnimate: false,
              },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            // currently in position of inForeign2
            destination: {
              index: preset.inForeign2.descriptor.index,
              droppableId: preset.inForeign2.descriptor.id,
            },
          },
        };
        const result: Position = getPageBorderBoxCenter({
          impact,
          afterCritical,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppable: preset.foreign,
        });

        const expected: Position = goBefore({
          axis,
          moveRelativeTo: offset(preset.inForeign2.page, displacedBy.point),
          isMoving: preset.inHome1.page,
        });
        expect(result).toEqual(expected);
      });
    });
  });
});
