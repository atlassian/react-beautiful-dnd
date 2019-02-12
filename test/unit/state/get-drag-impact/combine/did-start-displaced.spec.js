// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  DisplacedBy,
  DroppableDimensionMap,
  Displacement,
} from '../../../../../src/types';
import { vertical, horizontal } from '../../../../../src/state/axis';
import { getPreset, enableCombining } from '../../../../utils/dimension';
import {
  forward,
  backward,
} from '../../../../../src/state/user-direction/user-direction-preset';
import getDragImpact from '../../../../../src/state/get-drag-impact';
import getDisplacedBy from '../../../../../src/state/get-displaced-by';
import { patch, subtract, add } from '../../../../../src/state/position';
import getDisplacementMap from '../../../../../src/state/get-displacement-map';
import getHomeOnLift from '../../../../../src/state/get-home-on-lift';
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

    // moving onto inHome2
    it('should move forward onto an item that started displaced', () => {
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome2.displaceBy,
      );
      const startOfInHome3: Position = patch(
        axis.line,
        preset.inHome3.page.borderBox[axis.start],
        crossAxisCenter,
      );

      // before start of inHome3
      {
        const beforeStartOfInHome3: Position = subtract(
          startOfInHome3,
          patch(axis.line, 1),
        );

        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforeStartOfInHome3,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          userDirection: forward,
          onLift,
        });

        // ordered by closest to current location
        const displaced: Displacement[] = [
          // displaced is not animated as it was the starting displacement
          getNotAnimatedDisplacement(preset.inHome3),
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          direction: axis.direction,
          destination: {
            index: preset.inHome2.descriptor.index,
            droppableId: preset.inHome2.descriptor.droppableId,
          },
          // no merge yet
          merge: null,
        };

        expect(impact).toEqual(expected);
      }
      // on start of inhome3 - now should merge
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

        // ordered by closest to current location
        const displaced: Displacement[] = [
          // displaced is not animated as it was the starting displacement
          getNotAnimatedDisplacement(preset.inHome3),
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          direction: axis.direction,
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

    it('should remain displaced when moving around in the first two thirds of the target', () => {
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome2.displaceBy,
      );
      const startOfInHome3: Position = patch(
        axis.line,
        preset.inHome3.page.borderBox[axis.start],
        crossAxisCenter,
      );
      const onTwoThirdsOfInHome3: Position = add(
        startOfInHome3,
        patch(axis.line, preset.inHome3.page.borderBox[axis.size] * 0.666),
      );

      // before onTwoThirds - still should merge
      {
        const beforeOnTwoThirds: Position = subtract(
          onTwoThirdsOfInHome3,
          patch(axis.line, 1),
        );
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforeOnTwoThirds,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          userDirection: forward,
          onLift,
        });

        // ordered by closest to current location
        const displaced: Displacement[] = [
          // displaced is not animated as it was the starting displacement
          getNotAnimatedDisplacement(preset.inHome3),
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          direction: axis.direction,
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

      // onTwoThirds - still should merge
    });

    it('should move backwards onto an item that did not start displaced', () => {});

    it('should remain displaced when moving around the the last two thirds of the target', () => {});
  });
});
