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

    // moving inHome2 forward past inHome4
    const goingForwardsCenter: Position = patch(
      axis.line,
      // over top edge
      preset.inHome4.page.borderBox[axis.start] + 1,
      // no change
      preset.inHome2.page.borderBox.center[axis.crossAxisLine],
    );
    // in front of start so will displace backwards
    const willDisplaceForward: boolean = false;
    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome2.displaceBy,
      willDisplaceForward,
    );
    const goingForwards: DragImpact = getDragImpact({
      pageBorderBoxCenter: goingForwardsCenter,
      draggable: preset.inHome2,
      draggables: preset.draggables,
      droppables: preset.droppables,
      // previousImpact: noImpact,
      previousImpact: getHomeImpact(preset.inHome2, preset.home),
      viewport,
      direction: forward,
    });

    it('should displace items when moving over their bottom edge', () => {
      // ordered by closest displaced
      const expected: DragImpact = {
        movement: {
          // ordered by closest to current location
          ...getDisplacedWithMap([
            {
              draggableId: preset.inHome4.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: preset.inHome3.descriptor.id,
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
          // is in index of inHome4
          index: 3,
        },
        merge: null,
      };

      expect(goingForwards).toEqual(expected);
    });

    it('should end displacement if moving backward over the displaced bottom edge', () => {
      const crossAxisCenter: number =
        preset.inHome2.page.borderBox.center[axis.crossAxisLine];
      const endEdge: number = preset.inHome4.page.borderBox[axis.end];
      // displaced backwards
      const displacedEndEdge: number =
        endEdge - preset.inHome2.displaceBy[axis.line];

      // not far enough
      const goingBackwards1: Position = patch(
        axis.line,
        // over bottom edge with without displacement
        endEdge - 1,
        crossAxisCenter,
      );
      const backwardImpact1: DragImpact = getDragImpact({
        pageBorderBoxCenter: goingBackwards1,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: goingForwards,
        viewport,
        direction: backward,
      });
      expect(backwardImpact1).toEqual(goingForwards);

      // still not far enough

      const goingForwards2: Position = patch(
        axis.line,
        // over bottom edge with displace displacement - but not past it
        displacedEndEdge,
        crossAxisCenter,
      );
      const backwardImpact2: DragImpact = getDragImpact({
        pageBorderBoxCenter: goingForwards2,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousImpact: backwardImpact1,
        viewport,
        direction: backward,
      });
      expect(backwardImpact2).toEqual(goingForwards);

      // okay, now far enough
      const goingBackwardEnough: Position = patch(
        axis.line,
        // backwards past end edge
        displacedEndEdge - 1,
        // no change
        crossAxisCenter,
      );

      // checking that it does not matter which impact we are going from
      [goingForwards, backwardImpact1, backwardImpact2].forEach(
        (previousImpact: DragImpact) => {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: goingBackwardEnough,
            draggable: preset.inHome2,
            draggables: preset.draggables,
            droppables: preset.droppables,
            previousImpact,
            viewport,
            direction: backward,
          });
          const expected: DragImpact = {
            movement: {
              // dropping inHome4 from displaced
              ...getDisplacedWithMap([
                {
                  draggableId: preset.inHome3.descriptor.id,
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
              // is in position of inHome2
              index: 2,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        },
      );
    });

    it('should apply displacement to edge detection if entering the list', () => {
      const startEdge: number = preset.inHome1.page.borderBox[axis.start];
      // will be displaced backwards when in front of start
      const displacedStart: number =
        startEdge - preset.inHome3.displaceBy[axis.line];
      const crossAxisCenter: number =
        preset.inHome3.page.borderBox.center[axis.crossAxisLine];
      // actual
      {
        // moving inHome3 over the top edge of displaced inHome1
        const target: Position = patch(
          axis.line,
          // over top edge with with displacement
          displacedStart + 1,
          // no change
          crossAxisCenter,
        );

        // moving from outside of the list
        // TODO: also for backwards?
        const movingForwards: DragImpact = getDragImpact({
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
        expect(movingForwards).toEqual(expected);
      }
      // validation
      {
        // moving inHome3 over the top edge of displaced inHome1
        const target: Position = patch(
          axis.line,
          // not over displaced edge
          displacedStart,
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
