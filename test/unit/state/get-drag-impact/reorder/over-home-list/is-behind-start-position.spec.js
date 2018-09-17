// @flow
import { type Position } from 'css-box-model';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import noImpact from '../../../../../../src/state/no-impact';
import { patch } from '../../../../../../src/state/position';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import { getPreset } from '../../../../../utils/dimension';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import type {
  Axis,
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
import { getDisplacedWithMap } from './utils';
import getHomeImpact from '../../../../../../src/state/get-home-impact';

[(vertical, horizontal)].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    // moving inHome3 back past inHome1
    const goingBackwardsCenter: Position = patch(
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
    const goingBackwards: DragImpact = getDragImpact({
      pageBorderBoxCenter: goingBackwardsCenter,
      draggable: preset.inHome3,
      draggables: preset.draggables,
      droppables: preset.droppables,
      // previousImpact: noImpact,
      previousImpact: getHomeImpact(preset.inHome3, preset.home),
      viewport,
      direction: backward,
    });

    it('should displace items when moving over their bottom edge', () => {
      // ordered by closest displaced
      const expected: DragImpact = {
        movement: {
          // ordered by closest to current location
          ...getDisplacedWithMap([
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
          ]),
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

      expect(goingBackwards).toEqual(expected);
    });

    it('should end displacement if moving forward over the displaced top edge', () => {
      const crossAxisCenter: number =
        preset.inHome3.page.borderBox.center[axis.crossAxisLine];
      const topEdge: number = preset.inHome1.page.borderBox[axis.start];
      const displacedTopEdge: number =
        topEdge + preset.inHome3.displaceBy[axis.line];
      const goingForwards1: Position = patch(
        axis.line,
        // over top edge with without displacement
        topEdge + 1,
        // no change
        crossAxisCenter,
      );
      const forwardImpact1: DragImpact = getDragImpact({
        pageBorderBoxCenter: goingForwards1,
        draggable: preset.inHome3,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: goingBackwards,
        viewport,
        direction: forward,
      });
      expect(forwardImpact1).toEqual(goingBackwards);

      // still not far enough
      const goingForwards2: Position = patch(
        axis.line,
        // over top edge with without displacement
        displacedTopEdge,
        // no change
        crossAxisCenter,
      );
      const forwardImpact2: DragImpact = getDragImpact({
        pageBorderBoxCenter: goingForwards2,
        draggable: preset.inHome3,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: forwardImpact1,
        viewport,
        direction: forward,
      });
      expect(forwardImpact2).toEqual(goingBackwards);

      // okay, now far enough
      const goingForwardsEnough: Position = patch(
        axis.line,
        // over top edge with with displacement
        displacedTopEdge + 1,
        // no change
        crossAxisCenter,
      );

      // checking that it does not matter which impact we are going from
      [goingBackwards, forwardImpact1, forwardImpact2].forEach(
        (previousImpact: DragImpact) => {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: goingForwardsEnough,
            draggable: preset.inHome3,
            draggables: preset.draggables,
            droppables: preset.droppables,
            previousImpact,
            viewport,
            direction: forward,
          });
          const expected: DragImpact = {
            movement: {
              // ordered by closest to current location
              ...getDisplacedWithMap([
                {
                  draggableId: preset.inHome2.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
              ]),
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
          expect(impact).toEqual(expected);
        },
      );
    });

    it('should apply displacement to edge detection if entering the list', () => {
      const crossAxisCenter: number =
        preset.inHome3.page.borderBox.center[axis.crossAxisLine];
      const topEdge: number = preset.inHome1.page.borderBox[axis.start];
      const displacedTopEdge: number =
        topEdge + preset.inHome3.displaceBy[axis.line];
      // actual
      {
        // moving inHome3 over the top edge of displaced inHome1
        const target: Position = patch(
          axis.line,
          // over top edge with with displacement
          displacedTopEdge + 1,
          // no change
          crossAxisCenter,
        );

        // moving from outside of the list
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: target,
          draggable: preset.inHome3,
          draggables: preset.draggables,
          droppables: preset.droppables,
          // no previous impact
          previousImpact: noImpact,
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
        expect(impact).toEqual(expected);
      }
      // validation
      {
        // moving inHome3 over the top edge of displaced inHome1
        const target: Position = patch(
          axis.line,
          // not moving beyond top edge
          displacedTopEdge,
          // no change
          crossAxisCenter,
        );

        // moving from outside of the list
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: target,
          draggable: preset.inHome3,
          draggables: preset.draggables,
          droppables: preset.droppables,
          // no previous impact
          previousImpact: noImpact,
          viewport,
          direction: forward,
        });

        const newDisplaced: Displacement[] = [
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
            // before inhome1
            index: 0,
          },
          merge: null,
        };
        expect(impact).toEqual(expected);
      }
    });
  });
});
