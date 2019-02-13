// @flow
import { type Position } from 'css-box-model';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import { patch } from '../../../../../../src/state/position';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import { getPreset } from '../../../../../utils/dimension';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import type {
  Axis,
  DragImpact,
  Viewport,
  Displacement,
  DisplacedBy,
} from '../../../../../../src/types';
import {
  backward,
  forward,
} from '../../../../../../src/state/user-direction/user-direction-preset';
import getHomeOnLift from '../../../../../../src/state/get-home-on-lift';
import getVisibleDisplacement from '../../../../../utils/get-displacement/get-visible-displacement';
import getNotAnimatedDisplacement from '../../../../../utils/get-displacement/get-not-animated-displacement';
import beforePoint from '../../../../../utils/before-point';
import afterPoint from '../../../../../utils/after-point';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    const crossAxisCenter: number =
      preset.inHome2.page.borderBox.center[axis.crossAxisLine];

    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome2.displaceBy,
    );
    const { onLift, impact: homeImpact } = getHomeOnLift({
      draggable: preset.inHome2,
      home: preset.home,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });

    const startOfInHome3: Position = patch(
      axis.line,
      preset.inHome3.page.borderBox[axis.start],
      crossAxisCenter,
    );

    const goingForwards: DragImpact = getDragImpact({
      pageBorderBoxCenter: startOfInHome3,
      draggable: preset.inHome2,
      draggables: preset.draggables,
      droppables: preset.droppables,
      previousImpact: homeImpact,
      viewport,
      userDirection: forward,
      onLift,
    });

    // Do not need to move forward to a displaced edge.
    // The original edge is the displaced edge
    it('should displace items when moving forwards onto their start edge', () => {
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforePoint(startOfInHome3, axis),
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: homeImpact,
          viewport,
          userDirection: forward,
          onLift,
        });

        // ordered by closest to current location
        const displaced: Displacement[] = [
          // inHome4 would have been displaced on lift so it won't be animated
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
            // in original position
            droppableId: preset.home.descriptor.id,
            index: preset.inHome2.descriptor.index,
          },
          merge: null,
        };

        expect(impact).toEqual(expected);
      }
      // ordered by closest to current location
      const displaced: Displacement[] = [
        // inHome4 would have been displaced on lift so it won't be animated
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
          // is now in position of inHome3
          droppableId: preset.home.descriptor.id,
          index: preset.inHome3.descriptor.index,
        },
        merge: null,
      };

      expect(goingForwards).toEqual(expected);
    });

    // Even though inHome3 is not 'displaced'
    // it is visibly displaced from the start of the drag
    it('should end displacement if moving backwards over the visibly displaced bottom edge', () => {
      const bottomEdgeOfInHome3: number =
        preset.inHome3.page.borderBox[axis.end];

      const onDisplacedBottomOfInHome3: Position = patch(
        axis.line,
        bottomEdgeOfInHome3 - displacedBy.value,
        crossAxisCenter,
      );

      // still not far enough
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: afterPoint(onDisplacedBottomOfInHome3, axis),
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: goingForwards,
          viewport,
          userDirection: backward,
          onLift,
        });
        expect(impact).toEqual(goingForwards);
      }
      // no longer displace as we have moved onto the bottom edge
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: onDisplacedBottomOfInHome3,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: goingForwards,
          viewport,
          userDirection: backward,
          onLift,
        });

        const displaced: Displacement[] = [
          // is now animated
          getVisibleDisplacement(preset.inHome3),
          // original displacement stays not displaced
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
            droppableId: preset.home.descriptor.id,
            index: preset.inHome2.descriptor.index,
          },
          merge: null,
        };
        expect(impact).toEqual(expected);
      }
    });
  });
});
