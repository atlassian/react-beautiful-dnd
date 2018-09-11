// @flow
import { type Position } from 'css-box-model';
import getDragImpact from '../../../../../src/state/get-drag-impact';
import noImpact from '../../../../../src/state/no-impact';
import { add, patch, subtract } from '../../../../../src/state/position';
import { vertical, horizontal } from '../../../../../src/state/axis';
import { scrollDroppable } from '../../../../../src/state/droppable-dimension';
import {
  getPreset,
  disableDroppable,
  makeScrollable,
  getDroppableDimension,
  getDraggableDimension,
} from '../../../../utils/dimension';
import getViewport from '../../../../../src/view/window/get-viewport';
import getDisplacementMap from '../../../../../src/state/get-displacement-map';
import type {
  Axis,
  DraggableDimension,
  DroppableDimension,
  DroppableDimensionMap,
  DragImpact,
  DraggableDimensionMap,
  Viewport,
  UserDirection,
  Displacement,
} from '../../../../../src/types';

const viewport: Viewport = getViewport();
const dontCareAboutDirection: UserDirection = {
  vertical: 'down',
  horizontal: 'right',
};

[(vertical, horizontal)].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    const scrollableHome: DroppableDimension = makeScrollable(home);
    const withScrollableHome = {
      ...droppables,
      [home.descriptor.id]: scrollableHome,
    };

    // moving inHome1 past inHome2 by scrolling the dimension
    describe('moving beyond start position with own scroll', () => {
      it('should move past other draggables', () => {
        // the middle of the target edge
        const startOfInHome2: Position = patch(
          axis.line,
          inHome2.page.borderBox[axis.start],
          inHome2.page.borderBox.center[axis.crossAxisLine],
        );
        const distanceNeeded: Position = add(
          subtract(startOfInHome2, inHome1.page.borderBox.center),
          // need to move over the edge
          patch(axis.line, 1),
        );
        const scrolledHome: DroppableDimension = scrollDroppable(
          scrollableHome,
          distanceNeeded,
        );
        const updatedDroppables: DroppableDimensionMap = {
          ...withScrollableHome,
          [home.descriptor.id]: scrolledHome,
        };
        // no changes in current page center from original
        const pageBorderBoxCenter: Position = inHome1.page.borderBox.center;
        const expected: DragImpact = {
          movement: {
            amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
            // ordered by closest to current location
            displaced: [
              {
                draggableId: inHome2.descriptor.id,
                isVisible: true,
                shouldAnimate: true,
              },
            ],
            isInFrontOfStart: true,
          },
          direction: axis.direction,
          destination: {
            droppableId: home.descriptor.id,
            // is now after inHome2
            index: 1,
          },
        };

        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter,
          draggable: inHome1,
          draggables,
          droppables: updatedDroppables,
          previousImpact: noImpact,
          viewport,
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
          inHome2.page.borderBox[axis.end],
          inHome2.page.borderBox.center[axis.crossAxisLine],
        );
        const distanceNeeded: Position = add(
          subtract(endOfInHome2, inHome4.page.borderBox.center),
          // need to move over the edge
          patch(axis.line, -1),
        );
        const scrolledHome: DroppableDimension = scrollDroppable(
          scrollableHome,
          distanceNeeded,
        );
        const updatedDroppables: DroppableDimensionMap = {
          ...withScrollableHome,
          [home.descriptor.id]: scrolledHome,
        };
        // no changes in current page center from original
        const pageBorderBoxCenter: Position = inHome4.page.borderBox.center;
        const expected: DragImpact = {
          movement: {
            amount: patch(axis.line, inHome4.page.marginBox[axis.size]),
            // ordered by closest to current location
            displaced: [
              {
                draggableId: inHome2.descriptor.id,
                isVisible: true,
                shouldAnimate: true,
              },
              {
                draggableId: inHome3.descriptor.id,
                isVisible: true,
                shouldAnimate: true,
              },
            ],
            isInFrontOfStart: false,
          },
          direction: axis.direction,
          destination: {
            droppableId: home.descriptor.id,
            // is now before inHome2
            index: 1,
          },
        };

        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter,
          draggable: inHome4,
          draggables,
          droppables: updatedDroppables,
          previousImpact: noImpact,
          viewport,
        });

        expect(impact).toEqual(expected);
      });
    });
  });
});
