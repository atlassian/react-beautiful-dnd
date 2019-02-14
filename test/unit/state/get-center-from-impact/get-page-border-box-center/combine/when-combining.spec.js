// @flow
// @flow
import type { Position } from 'css-box-model';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import getPageBorderBoxCenter from '../../../../../../src/state/get-center-from-impact/get-page-border-box-center';
import getHomeOnLift from '../../../../../../src/state/get-home-on-lift';
import { getPreset } from '../../../../../utils/dimension';
import type { Axis } from '../../../../../../src/types';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import {
  forward,
  backward,
} from '../../../../../../src/state/user-direction/user-direction-preset';
import getNotAnimatedDisplacement from '../../../../../utils/get-displacement/get-not-animated-displacement';
import { subtract, add } from '../../../../../../src/state/position';
import getVisibleDisplacement from '../../../../../utils/get-displacement/get-visible-displacement';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const withCombineEnabled: DroppableDimension = {
      ...preset.home,
      isCombineEnabled: true,
    };
    const { onLift } = getHomeOnLift({
      draggable: preset.inHome2,
      home: withCombineEnabled,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });
    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome2.displaceBy,
    );

    describe('item started displaced', () => {
      it('should move onto a displaced center - the initial visible center', () => {
        const displaced: Displacement = [
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
          destination: null,
          merge: {
            whenEntered: forward,
            // combining with inHome3
            combine: {
              draggableId: preset.inHome3.descriptor.id,
              droppableId: preset.inHome3.descriptor.droppableId,
            },
          },
        };

        const result: Position = getPageBorderBoxCenter({
          impact,
          onLift,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppable: withCombineEnabled,
        });

        expect(result).toEqual(preset.inHome3.page.borderBox.center);
      });

      it('should move onto a non-displaced center', () => {
        // combining with inHome3 which is no longer displaced
        // inHome2 would have moved forward and is now moving backwards
        const displaced: Displacement = [
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const impact: DragImpact = {
          movement: {
            displacedBy,
            displaced,
            map: getDisplacementMap(displaced),
          },
          direction: axis.direction,
          destination: null,
          merge: {
            whenEntered: backward,
            // combining with not displaced inHome1
            combine: {
              draggableId: preset.inHome3.descriptor.id,
              droppableId: preset.inHome3.descriptor.droppableId,
            },
          },
        };

        const result: Position = getPageBorderBoxCenter({
          impact,
          onLift,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppable: withCombineEnabled,
        });

        const expected: Position = subtract(
          preset.inHome3.page.borderBox.center,
          displacedBy.point,
        );
        expect(result).toEqual(expected);
      });
    });

    describe('item did not start displaced', () => {
      it('should move onto a displaced center', () => {
        // moving inHome2 backwards past inHome1 (pushing it forward)
        // and then moving onto inHome1
        const displaced: Displacement = [
          getVisibleDisplacement(preset.inHome1),
          // inHome2 not displaced as it is the dragging item
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
          destination: null,
          merge: {
            whenEntered: backward,
            // combining with not displaced inHome1
            combine: {
              draggableId: preset.inHome1.descriptor.id,
              droppableId: preset.inHome1.descriptor.droppableId,
            },
          },
        };

        const result: Position = getPageBorderBoxCenter({
          impact,
          onLift,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppable: withCombineEnabled,
        });

        const expected: Position = add(
          preset.inHome1.page.borderBox.center,
          displacedBy.point,
        );
        expect(result).toEqual(expected);
      });

      it('should move onto a non-displaced center', () => {
        // moving inHome2 backwards onto inHome1
        const displaced: Displacement = [
          // inHome2 not displaced as it is the dragging item
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
          destination: null,
          merge: {
            whenEntered: backward,
            // combining with not displaced inHome1
            combine: {
              draggableId: preset.inHome1.descriptor.id,
              droppableId: preset.inHome1.descriptor.droppableId,
            },
          },
        };

        const result: Position = getPageBorderBoxCenter({
          impact,
          onLift,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppable: withCombineEnabled,
        });

        expect(result).toEqual(preset.inHome1.page.borderBox.center);
      });
    });
  });
});
