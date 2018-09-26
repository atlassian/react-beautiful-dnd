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

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    // behind start so will displace forwards
    const willDisplaceForward: boolean = true;
    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome3.displaceBy,
      willDisplaceForward,
    );

    describe('moving within list', () => {
      // moving inHome3 back past inHome1
      const goingBackwardsCenter: Position = patch(
        axis.line,
        // over bottom edge
        preset.inHome1.page.borderBox[axis.end] - 1,
        // no change
        preset.inHome3.page.borderBox.center[axis.crossAxisLine],
      );

      const goingBackwards: DragImpact = getDragImpact({
        pageBorderBoxCenter: goingBackwardsCenter,
        draggable: preset.inHome3,
        draggables: preset.draggables,
        droppables: preset.droppables,
        // previousImpact: noImpact,
        previousImpact: getHomeImpact(preset.inHome3, preset.home),
        viewport,
        userDirection: backward,
      });

      it('should displace items when moving over backwards over their bottom edge', () => {
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
          userDirection: forward,
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
          userDirection: forward,
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
              userDirection: forward,
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
    });

    describe('entering list', () => {
      it('should apply displacement to top edge if moving forward', () => {
        const crossAxisCenter: number =
          preset.inHome3.page.borderBox.center[axis.crossAxisLine];
        const startEdgeOfInHome1: number =
          preset.inHome1.page.borderBox[axis.start];
        // when behind start we displace forward
        const displacedStartOfInHome1: number =
          startEdgeOfInHome1 + preset.inHome3.displaceBy[axis.line];

        // should displace everything forward
        {
          const overStart: Position = patch(
            axis.line,
            startEdgeOfInHome1 + 1,
            crossAxisCenter,
          );
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: overStart,
            draggable: preset.inHome3,
            draggables: preset.draggables,
            droppables: preset.droppables,
            // no previous impact
            previousImpact: noImpact,
            viewport,
            userDirection: forward,
          });
          // everything displaced before inHome3
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
              index: 0,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        }

        // should displace everything forward
        {
          const overDisplacedStart: Position = patch(
            axis.line,
            displacedStartOfInHome1 + 1,
            crossAxisCenter,
          );
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: overDisplacedStart,
            draggable: preset.inHome3,
            draggables: preset.draggables,
            droppables: preset.droppables,
            // no previous impact
            previousImpact: noImpact,
            viewport,
            userDirection: forward,
          });
          // inHome1 will not be displaced
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
      });

      it('should check against the bottom edge if moving backwards', () => {
        // moving inHome3 back past inHome1
        const goingBackwardsCenter: Position = patch(
          axis.line,
          // over bottom edge
          preset.inHome1.page.borderBox[axis.end] - 1,
          // no change
          preset.inHome3.page.borderBox.center[axis.crossAxisLine],
        );
        const goingBackwardsWithNoPrevious: DragImpact = getDragImpact({
          pageBorderBoxCenter: goingBackwardsCenter,
          draggable: preset.inHome3,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: noImpact,
          viewport,
          userDirection: backward,
        });

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

        expect(goingBackwardsWithNoPrevious).toEqual(expected);
      });
    });
  });
});
