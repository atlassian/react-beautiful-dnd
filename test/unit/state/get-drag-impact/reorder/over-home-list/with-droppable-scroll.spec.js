// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DisplacedBy,
  DroppableDimension,
  DroppableDimensionMap,
  DragImpact,
  Viewport,
  Displacement,
} from '../../../../../../src/types';
import { horizontal, vertical } from '../../../../../../src/state/axis';
import scrollDroppable from '../../../../../../src/state/droppable/scroll-droppable';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import { patch, subtract } from '../../../../../../src/state/position';
import {
  backward,
  forward,
} from '../../../../../../src/state/user-direction/user-direction-preset';
import getViewport from '../../../../../../src/view/window/get-viewport';
import { getPreset, makeScrollable } from '../../../../../utils/dimension';

import getHomeOnLift from '../../../../../../src/state/get-home-on-lift';
import getVisibleDisplacement from '../../../../../utils/get-displacement/get-visible-displacement';
import getNotAnimatedDisplacement from '../../../../../utils/get-displacement/get-not-animated-displacement';

const viewport: Viewport = getViewport();

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    const scrollableHome: DroppableDimension = makeScrollable(preset.home);
    const withScrollableHome = {
      ...preset.droppables,
      [preset.home.descriptor.id]: scrollableHome,
    };

    // moving inHome1 past inHome2 by scrolling the dimension
    describe('moving beyond start position with own scroll', () => {
      const { onLift, impact: homeImpact } = getHomeOnLift({
        draggable: preset.inHome1,
        home: scrollableHome,
        draggables: preset.draggables,
        viewport,
      });

      it('should move past other draggables', () => {
        // the middle of the target edge
        const startOfInHome2: Position = patch(
          axis.line,
          preset.inHome2.page.borderBox[axis.start],
          preset.inHome2.page.borderBox.center[axis.crossAxisLine],
        );
        const distanceNeeded: Position = subtract(
          startOfInHome2,
          preset.inHome1.page.borderBox.center,
        );
        const scrolledHome: DroppableDimension = scrollDroppable(
          scrollableHome,
          distanceNeeded,
        );
        const updatedDroppables: DroppableDimensionMap = {
          ...withScrollableHome,
          [preset.home.descriptor.id]: scrolledHome,
        };
        // no changes in current page center from original
        const pageBorderBoxCenter: Position =
          preset.inHome1.page.borderBox.center;
        // moving forward over inHome2
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome1.displaceBy,
        );
        const displaced: Displacement[] = [
          // inHome2 no longer displaced
          // originally displaced
          getNotAnimatedDisplacement(preset.inHome3),
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            map: getDisplacementMap(displaced),
            displaced,
            displacedBy,
          },
          direction: axis.direction,
          destination: {
            // now in position of inHome2 as it has moved backwards (it started displaced)
            droppableId: preset.home.descriptor.id,
            index: preset.inHome2.descriptor.index,
          },
          merge: null,
        };

        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: updatedDroppables,
          previousImpact: homeImpact,
          viewport,
          userDirection: forward,
          onLift,
        });

        expect(impact).toEqual(expected);
      });
    });

    // moving inHome4 back past inHome2
    describe('moving back past start position with own scroll', () => {
      const { onLift, impact: homeImpact } = getHomeOnLift({
        draggable: preset.inHome4,
        home: scrollableHome,
        draggables: preset.draggables,
        viewport,
      });

      it('should move back past inHome2', () => {
        // the middle of the target edge
        const endOfInHome2: Position = patch(
          axis.line,
          preset.inHome2.page.borderBox[axis.end],
          preset.inHome2.page.borderBox.center[axis.crossAxisLine],
        );
        const distanceNeeded: Position = subtract(
          endOfInHome2,
          preset.inHome4.page.borderBox.center,
        );
        const scrolledHome: DroppableDimension = scrollDroppable(
          scrollableHome,
          distanceNeeded,
        );
        const updatedDroppables: DroppableDimensionMap = {
          ...withScrollableHome,
          [preset.home.descriptor.id]: scrolledHome,
        };
        // no changes in current page center from original
        const pageBorderBoxCenter: Position =
          preset.inHome4.page.borderBox.center;
        // moving inHome4 backwards
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome4.displaceBy,
        );
        // ordered by closest to current location
        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inHome2),
          getVisibleDisplacement(preset.inHome3),
          // inHome4 not displaced as it is the dragging item
        ];
        const expected: DragImpact = {
          movement: {
            displacedBy,
            displaced,
            map: getDisplacementMap(displaced),
          },
          direction: axis.direction,
          destination: {
            // is now in place of inHome2
            droppableId: preset.home.descriptor.id,
            index: preset.inHome2.descriptor.index,
          },
          merge: null,
        };

        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter,
          draggable: preset.inHome4,
          draggables: preset.draggables,
          droppables: updatedDroppables,
          previousImpact: homeImpact,
          viewport,
          userDirection: backward,
          onLift,
        });

        expect(impact).toEqual(expected);
      });
    });
  });
});
