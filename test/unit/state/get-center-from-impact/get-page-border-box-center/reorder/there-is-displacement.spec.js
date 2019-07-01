// @flow
import type { Position } from 'css-box-model';
import { offset } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  DisplacedBy,
  Displacement,
} from '../../../../../../src/types';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import getPageBorderBoxCenter from '../../../../../../src/state/get-center-from-impact/get-page-border-box-center';
import getLiftEffect from '../../../../../../src/state/get-lift-effect';
import { getPreset } from '../../../../../utils/dimension';
import { goBefore } from '../../../../../../src/state/get-center-from-impact/move-relative-to';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import { getForcedDisplacementGroups } from '../../../../../utils/impact';

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
          displaced: getForcedDisplacementGroups({
            visible: [preset.inHome3, preset.inHome4],
            animation: [false, false],
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
          displaced: getForcedDisplacementGroups({
            visible: [preset.inForeign2, preset.inForeign3, preset.inForeign4],
            animation: [false, false, false],
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
