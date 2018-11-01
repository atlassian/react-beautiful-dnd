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
import getDisplacedWithMap from './utils/get-displaced-with-map';
import getHomeImpact from '../../../../../../src/state/get-home-impact';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    // in front of start so will displace backwards
    const willDisplaceForward: boolean = false;
    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome2.displaceBy,
      willDisplaceForward,
    );

    describe('moving within list', () => {
      // moving inHome2 forward past inHome4
      const forwardsPastInHome4: Position = patch(
        axis.line,
        // on start edge
        preset.inHome4.page.borderBox[axis.start],
        // no change
        preset.inHome2.page.borderBox.center[axis.crossAxisLine],
      );

      const forwardsPastInHome4Impact: DragImpact = getDragImpact({
        pageBorderBoxCenter: forwardsPastInHome4,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        droppables: preset.droppables,
        // previousImpact: noImpact,
        previousImpact: getHomeImpact(preset.inHome2, preset.home),
        viewport,
        userDirection: forward,
      });

      it('should displace items when moving over their start edge', () => {
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

        expect(forwardsPastInHome4Impact).toEqual(expected);
      });

      it('should end displacement if moving backward over the displaced bottom edge', () => {
        const crossAxisCenter: number =
          preset.inHome2.page.borderBox.center[axis.crossAxisLine];
        const inHome4EndEdge: number = preset.inHome4.page.borderBox[axis.end];
        // displaced backwards
        const displacedInHome4EndEdge: number =
          inHome4EndEdge - preset.inHome2.displaceBy[axis.line];

        // not far enough
        const overBottomEdge: Position = patch(
          axis.line,
          // moving backwards over the bottom edge with without displacement
          inHome4EndEdge - 1,
          crossAxisCenter,
        );
        const overBottomEdgeImpact: DragImpact = getDragImpact({
          pageBorderBoxCenter: overBottomEdge,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: forwardsPastInHome4Impact,
          viewport,
          userDirection: backward,
        });
        expect(overBottomEdgeImpact).toEqual(forwardsPastInHome4Impact);

        // still not far enough

        const almostOnDisplacedBottomEdge: Position = patch(
          axis.line,
          // almost on edge
          displacedInHome4EndEdge + 1,
          crossAxisCenter,
        );
        const almostOnDisplacedBottomEdgeImpact: DragImpact = getDragImpact({
          pageBorderBoxCenter: almostOnDisplacedBottomEdge,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: preset.droppables,
          previousImpact: overBottomEdgeImpact,
          viewport,
          userDirection: backward,
        });
        expect(almostOnDisplacedBottomEdgeImpact).toEqual(
          forwardsPastInHome4Impact,
        );

        // okay, now far enough
        const onDisplacedBottomEdge: Position = patch(
          axis.line,
          // backwards onto the end edge
          displacedInHome4EndEdge,
          // no change
          crossAxisCenter,
        );

        // checking that it does not matter which impact we are going from
        [
          forwardsPastInHome4Impact,
          overBottomEdgeImpact,
          almostOnDisplacedBottomEdgeImpact,
        ].forEach((previousImpact: DragImpact) => {
          const onDisplacedBottomEdgeImpact: DragImpact = getDragImpact({
            pageBorderBoxCenter: onDisplacedBottomEdge,
            draggable: preset.inHome2,
            draggables: preset.draggables,
            droppables: preset.droppables,
            previousImpact,
            viewport,
            userDirection: backward,
          });
          const expected: DragImpact = {
            movement: {
              // should remove the displacement of inHome4
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
          expect(onDisplacedBottomEdgeImpact).toEqual(expected);
        });
      });
    });

    describe('entering list', () => {
      it('should add displacement to end edge if moving backwards', () => {
        const endEdge: number = preset.inHome4.page.borderBox[axis.end];
        // moving backwards when in front of start
        const displacedEndEdge: number =
          endEdge - preset.inHome2.displaceBy[axis.line];
        const crossAxisCenter: number =
          preset.inHome2.page.borderBox.center[axis.crossAxisLine];

        // over non-displaced end
        {
          const overEnd: Position = patch(
            axis.line,
            endEdge - 1,
            crossAxisCenter,
          );

          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: overEnd,
            draggable: preset.inHome2,
            draggables: preset.draggables,
            droppables: preset.droppables,
            // no previous impact
            previousImpact: noImpact,
            viewport,
            userDirection: backward,
          });
          // ordered by closest impacted
          const newDisplaced: Displacement[] = [
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
              // in position of inHome4
              index: 3,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        }
        // over displaced end
        {
          const overDisplacedEnd: Position = patch(
            axis.line,
            displacedEndEdge - 1,
            crossAxisCenter,
          );

          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: overDisplacedEnd,
            draggable: preset.inHome2,
            draggables: preset.draggables,
            droppables: preset.droppables,
            // no previous impact
            previousImpact: noImpact,
            viewport,
            userDirection: backward,
          });
          const newDisplaced: Displacement[] = [
            {
              draggableId: preset.inHome3.descriptor.id,
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
              // in position of inHome3
              index: 2,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        }
      });

      it('should not add displacement to top edge if moving forwards', () => {
        const startEdge: number = preset.inHome4.page.borderBox[axis.start];
        const crossAxisCenter: number =
          preset.inHome2.page.borderBox.center[axis.crossAxisLine];

        // not over non-displaced start
        {
          const beforeStart: Position = patch(
            axis.line,
            startEdge - 1,
            crossAxisCenter,
          );

          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: beforeStart,
            draggable: preset.inHome2,
            draggables: preset.draggables,
            droppables: preset.droppables,
            // no previous impact
            previousImpact: noImpact,
            viewport,
            userDirection: forward,
          });
          const newDisplaced: Displacement[] = [
            {
              draggableId: preset.inHome3.descriptor.id,
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
              // in position of inHome3
              index: 2,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        }

        // over non-displaced start
        {
          const onStart: Position = patch(
            axis.line,
            startEdge,
            crossAxisCenter,
          );

          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: onStart,
            draggable: preset.inHome2,
            draggables: preset.draggables,
            droppables: preset.droppables,
            // no previous impact
            previousImpact: noImpact,
            viewport,
            userDirection: forward,
          });
          const newDisplaced: Displacement[] = [
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
              // in position of inHome4
              index: 3,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        }
      });
    });
  });
});
