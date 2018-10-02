// @flow
import type { Position } from 'css-box-model';
import { horizontal, vertical } from '../../../../../../src/state/axis';
import scrollDroppable from '../../../../../../src/state/droppable/scroll-droppable';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import noImpact from '../../../../../../src/state/no-impact';
import { add, patch, subtract } from '../../../../../../src/state/position';
import {
  backward,
  forward,
} from '../../../../../../src/state/user-direction/user-direction-preset';
import getViewport from '../../../../../../src/view/window/get-viewport';
import { getPreset, makeScrollable } from '../../../../../utils/dimension';
import type {
  Axis,
  DisplacedBy,
  DroppableDimension,
  DroppableDimensionMap,
  DragImpact,
  Viewport,
  Displacement,
} from '../../../../../../src/types';

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
      it('should move past other draggables', () => {
        // the middle of the target edge
        const startOfInHome2: Position = patch(
          axis.line,
          preset.inHome2.page.borderBox[axis.start],
          preset.inHome2.page.borderBox.center[axis.crossAxisLine],
        );
        const distanceNeeded: Position = add(
          subtract(startOfInHome2, preset.inHome1.page.borderBox.center),
          // need to move over the edge
          patch(axis.line, 1),
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
        const willDisplaceForward: boolean = false;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome1.displaceBy,
          willDisplaceForward,
        );
        const displaced: Displacement[] = [
          {
            draggableId: preset.inHome2.descriptor.id,
            isVisible: true,
            shouldAnimate: true,
          },
        ];
        const expected: DragImpact = {
          movement: {
            map: getDisplacementMap(displaced),
            displaced,
            displacedBy,
            willDisplaceForward,
          },
          direction: axis.direction,
          destination: {
            droppableId: preset.home.descriptor.id,
            // is now after inHome2
            index: 1,
          },
          merge: null,
        };

        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: updatedDroppables,
          previousImpact: noImpact,
          viewport,
          userDirection: forward,
        });

        expect(impact).toEqual(expected);
      });
    });

    // moving inHome4 back past inHome2
    describe('moving back past start position with own scroll', () => {
      it('should move back past inHome2', () => {
        // the middle of the target edge
        const endOfInHome2: Position = patch(
          axis.line,
          preset.inHome2.page.borderBox[axis.end],
          preset.inHome2.page.borderBox.center[axis.crossAxisLine],
        );
        const distanceNeeded: Position = add(
          subtract(endOfInHome2, preset.inHome4.page.borderBox.center),
          // need to move over the edge
          patch(axis.line, -1),
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
        const willDisplaceForward: boolean = true;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome4.displaceBy,
          willDisplaceForward,
        );
        const displaced: Displacement[] = [
          // ordered by closest to current location
          {
            draggableId: preset.inHome2.descriptor.id,
            isVisible: true,
            shouldAnimate: true,
          },
          {
            draggableId: preset.inHome3.descriptor.id,
            isVisible: true,
            shouldAnimate: true,
          },
        ];
        const expected: DragImpact = {
          movement: {
            displacedBy,
            displaced,
            map: getDisplacementMap(displaced),
            willDisplaceForward,
          },
          direction: axis.direction,
          destination: {
            droppableId: preset.home.descriptor.id,
            // is now before inHome2
            index: 1,
          },
          merge: null,
        };

        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter,
          draggable: preset.inHome4,
          draggables: preset.draggables,
          droppables: updatedDroppables,
          previousImpact: noImpact,
          viewport,
          userDirection: backward,
        });

        expect(impact).toEqual(expected);
      });
    });
  });
});
