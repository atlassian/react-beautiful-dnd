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
import getHomeOnLift from '../../../../../../src/state/get-home-on-lift';
import { getPreset } from '../../../../../utils/dimension';
import { goBefore } from '../../../../../../src/state/get-center-from-impact/move-relative-to';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import getNotAnimatedDisplacement from '../../../../../utils/get-displacement/get-not-animated-displacement';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    describe('closest displaced started displaced', () => {
      it('should go before the visible (displaced) position of the item', () => {
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
        // moved forward over inHome2
        const displaced: Displacement[] = [
          getNotAnimatedDisplacement(preset.inHome3),
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const impact: DragImpact = {
          movement: {
            displacedBy,
            displaced,
            map: getDisplacementMap(displaced),
          },
          direction: axis.direction,
          // currently in position of inHome3
          destination: {
            index: preset.inHome3.descriptor.index,
            droppableId: preset.inHome3.descriptor.id,
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
        // moved into foreign
        const displaced: Displacement[] = [
          getNotAnimatedDisplacement(preset.inForeign2),
          getNotAnimatedDisplacement(preset.inForeign3),
          getNotAnimatedDisplacement(preset.inForeign4),
        ];
        const impact: DragImpact = {
          movement: {
            displacedBy,
            displaced,
            map: getDisplacementMap(displaced),
          },
          direction: axis.direction,
          // currently in position of inForeign2
          destination: {
            index: preset.inForeign2.descriptor.index,
            droppableId: preset.inForeign2.descriptor.id,
          },
          merge: null,
        };
        const result: Position = getPageBorderBoxCenter({
          impact,
          onLift,
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
