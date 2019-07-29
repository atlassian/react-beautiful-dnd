// @flow
import { offset, type Position } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  DisplacedBy,
} from '../../../../../../src/types';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import getPageBorderBoxCenter from '../../../../../../src/state/get-center-from-impact/get-page-border-box-center';
import getLiftEffect from '../../../../../../src/state/get-lift-effect';
import { getPreset } from '../../../../../utils/dimension';
import { goAfter } from '../../../../../../src/state/get-center-from-impact/move-relative-to';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import { negate } from '../../../../../../src/state/position';
import { emptyGroups } from '../../../../../../src/state/no-impact';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    describe('last item is the dragging item', () => {
      it('should return to the original center', () => {
        const { afterCritical, impact: homeImpact } = getLiftEffect({
          draggable: preset.inHome4,
          home: preset.home,
          draggables: preset.draggables,
          viewport: preset.viewport,
        });
        const result: Position = getPageBorderBoxCenter({
          impact: homeImpact,
          afterCritical,
          draggable: preset.inHome4,
          draggables: preset.draggables,
          droppable: preset.home,
        });

        expect(result).toEqual(preset.inHome4.page.borderBox.center);
      });
    });

    describe('last item started displaced', () => {
      it('should go after the item in its current non-displaced location', () => {
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
          displaced: emptyGroups,
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              index: preset.inHome4.descriptor.index,
              droppableId: preset.inHome4.descriptor.id,
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

        const expected: Position = goAfter({
          axis,
          moveRelativeTo: offset(
            preset.inHome4.page,
            negate(displacedBy.point),
          ),
          isMoving: preset.inHome1.page,
        });
        expect(result).toEqual(expected);
      });
    });

    describe('last item did not start displaced', () => {
      it('should go after the item in its current non-displaced location', () => {
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
          displaced: emptyGroups,
          displacedBy,
          at: {
            type: 'REORDER',
            // currently after inForeign4
            destination: {
              index: preset.inForeign4.descriptor.index + 1,
              droppableId: preset.inForeign4.descriptor.id,
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

        const expected: Position = goAfter({
          axis,
          moveRelativeTo: preset.inForeign4.page,
          isMoving: preset.inHome1.page,
        });
        expect(result).toEqual(expected);
      });
    });
  });
});
