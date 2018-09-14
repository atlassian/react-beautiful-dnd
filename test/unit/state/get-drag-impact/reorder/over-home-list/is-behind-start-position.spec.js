// @flow
import { type Position } from 'css-box-model';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import noImpact from '../../../../../../src/state/no-impact';
import { add, patch, subtract } from '../../../../../../src/state/position';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import { scrollDroppable } from '../../../../../../src/state/droppable-dimension';
import {
  getPreset,
  disableDroppable,
  makeScrollable,
  getDroppableDimension,
  getDraggableDimension,
} from '../../../../../utils/dimension';
import getViewport from '../../../../../../src/view/window/get-viewport';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import type {
  Axis,
  UserDirection,
  DragImpact,
  DisplacementMap,
  Viewport,
  Displacement,
  DisplacedBy,
} from '../../../../../../src/types';
import {
  backward,
  forward,
} from '../../../../../../src/state/user-direction/user-direction-preset';

const viewport: Viewport = getViewport();

[(vertical, horizontal)].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    // moving inHome3 back past inHome1
    const pageBorderBoxCenter: Position = patch(
      axis.line,
      // over bottom edge
      preset.inHome1.page.borderBox[axis.end] - 1,
      // no change
      preset.inHome3.page.borderBox.center[axis.crossAxisLine],
    );
    // behind start so will displace forwards
    const willDisplaceForward: boolean = true;
    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome3.displaceBy,
      willDisplaceForward,
    );

    const displaced: Displacement[] = [
      {
        draggableId: preset.inHome1.descriptor.id,
        isVisible: true,
        shouldAnimate: true,
      },
      {
        draggableId: preset.inHome2.descriptor.id,
        isVisible: true,
        shouldAnimate: true,
      },
    ];
    const map: DisplacementMap = getDisplacementMap(displaced);

    it('should displace items when moving over their bottom edge', () => {
      [forward, backward].forEach((userDirection: UserDirection) => {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter,
          draggable: preset.inHome3,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: noImpact,
          viewport,
          direction: userDirection,
        });
        const expected: DragImpact = {
          movement: {
            // ordered by closest to current location
            displaced,
            map,
            willDisplaceForward,
            displacedBy,
          },
          direction: axis.direction,
          destination: {
            droppableId: preset.home.descriptor.id,
            // is now before inHome1
            index: 0,
          },
          merge: null,
        };

        expect(impact).toEqual(expected);
      });
    });

    describe('moving forwards again', () => {
      const first: DragImpact = getDragImpact({
        pageBorderBoxCenter,
        draggable: preset.inHome3,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: noImpact,
        viewport,
        direction: backward,
      });
      it('should validate', () => {
        const expectedFirst: DragImpact = {
          movement: {
            // ordered by closest to current location
            displaced,
            map,
            willDisplaceForward,
            displacedBy,
          },
          direction: axis.direction,
          destination: {
            droppableId: preset.home.descriptor.id,
            // is now before inHome1
            index: 0,
          },
          merge: null,
        };
        expect(first).toEqual(expectedFirst);
      });

      it('should not end displacement if not moved over the displaced top edge', () => {
        const target1: Position = patch(
          axis.line,
          // over top edge with without displacement
          preset.inHome1.page.borderBox[axis.start] + 1,
          // no change
          preset.inHome3.page.borderBox.center[axis.crossAxisLine],
        );
        const second: DragImpact = getDragImpact({
          pageBorderBoxCenter: target1,
          draggable: preset.inHome3,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: first,
          viewport,
          direction: forward,
        });
        expect(second).toEqual(first);

        // still not far enough
        const target2: Position = patch(
          axis.line,
          // over top edge with without displacement
          preset.inHome1.page.borderBox[axis.start] +
            preset.inHome3.displaceBy[axis.line],
          // no change
          preset.inHome3.page.borderBox.center[axis.crossAxisLine],
        );
        const third: DragImpact = getDragImpact({
          pageBorderBoxCenter: target2,
          draggable: preset.inHome3,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: first,
          viewport,
          direction: forward,
        });
        expect(third).toEqual(first);
      });

      it('should end displacement when moving forward over the displaced top edge', () => {
        // moving inHome3 over the top edge of displaced inHome1
        const target: Position = patch(
          axis.line,
          // over top edge with with displacement
          preset.inHome1.page.borderBox[axis.start] +
            preset.inHome3.displaceBy[axis.line] +
            1,
          // no change
          preset.inHome3.page.borderBox.center[axis.crossAxisLine],
        );

        const second: DragImpact = getDragImpact({
          pageBorderBoxCenter: target,
          draggable: preset.inHome3,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: first,
          viewport,
          direction: forward,
        });

        const newDisplaced: Displacement[] = [
          {
            draggableId: preset.inHome2.descriptor.id,
            isVisible: true,
            shouldAnimate: true,
          },
        ];
        const newMap: DisplacementMap = getDisplacementMap(newDisplaced);
        const expected: DragImpact = {
          movement: {
            // ordered by closest to current location
            displaced: newDisplaced,
            map: newMap,
            willDisplaceForward,
            displacedBy,
          },
          direction: axis.direction,
          destination: {
            droppableId: preset.home.descriptor.id,
            // is now after inHome1
            index: 1,
          },
          merge: null,
        };
        expect(second).toEqual(expected);
      });
    });
  });
});
