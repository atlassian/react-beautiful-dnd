// @flow
import type { Position } from 'css-box-model';
import { offset } from 'css-box-model';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import getPageBorderBoxCenter from '../../../../../../src/state/get-center-from-impact/get-page-border-box-center';
import getHomeOnLift from '../../../../../../src/state/get-home-on-lift';
import { getPreset } from '../../../../../utils/dimension';
import type {
  Axis,
  DragImpact,
  DisplacedBy,
} from '../../../../../../src/types';
import { goAfter } from '../../../../../../src/state/get-center-from-impact/move-relative-to';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import { negate } from '../../../../../../src/state/position';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    describe('last item is the dragging item', () => {
      it('should return to the original center', () => {
        const { onLift, impact: homeImpact } = getHomeOnLift({
          draggable: preset.inHome4,
          home: preset.home,
          draggables: preset.draggables,
          viewport: preset.viewport,
        });
        const result: Position = getPageBorderBoxCenter({
          impact: homeImpact,
          onLift,
          draggable: preset.inHome4,
          draggables: preset.draggables,
          droppable: preset.home,
        });

        expect(result).toEqual(preset.inHome4.page.borderBox.center);
      });
    });

    describe('last item started displaced', () => {
      it('should go after the item in its current non-displaced location', () => {
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
        const impact: DragImpact = {
          movement: {
            displacedBy,
            displaced: [],
            map: {},
          },
          direction: axis.direction,
          // currently after inForeign4
          destination: {
            index: preset.inForeign4.descriptor.index + 1,
            droppableId: preset.home.descriptor.id,
          },
          merge: null,
        };
        const result: Position = getPageBorderBoxCenter({
          impact,
          onLift,
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
          isMoving: preset.inHome4.page,
        });
        expect(result).toEqual(expected);
      });
    });

    describe('last item did not start displaced', () => {
      it('should go after the item in its current non-displaced location', () => {});
    });
  });
});
