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
import getHomeOnLift from '../../../../../../src/state/get-home-on-lift';
import getVisibleDisplacement from '../../../../../utils/get-displacement/get-visible-displacement';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    // dragging inHome1
    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome1.displaceBy,
    );
    const { onLift, impact: homeImpact } = getHomeOnLift({
      draggable: preset.inHome1,
      home: preset.home,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });

    const withDisplacement = (edge: number) => edge + displacedBy.value;

    describe('when entering list from outside', () => {
      it('should displace if moving forward onto the displaced start edge', () => {
        // moving inHome1 into foreign
        const startEdge: number = preset.inForeign2.page.borderBox[axis.start];
        const displacedStartEdge: number = withDisplacement(startEdge);
        const crossAxisCenter: number =
          preset.foreign.page.borderBox.center[axis.crossAxisLine];

        const onDisplacedStart: Position = patch(
          axis.line,
          displacedStartEdge,
          crossAxisCenter,
        );
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: onDisplacedStart,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: preset.droppables,
          // no previous impact
          previousImpact: homeImpact,
          viewport,
          userDirection: forward,
          onLift,
        });
        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inForeign2),
          getVisibleDisplacement(preset.inForeign3),
          getVisibleDisplacement(preset.inForeign4),
        ];
        const map: DisplacementMap = getDisplacementMap(displaced);
        const expected: DragImpact = {
          movement: {
            // ordered by closest to current location
            displaced,
            map,
            displacedBy,
          },
          direction: axis.direction,
          destination: {
            droppableId: preset.foreign.descriptor.id,
            // in position of inForeign2
            index: 1,
          },
          merge: null,
        };
        expect(impact).toEqual(expected);
      });

      it('should displace if moving backwards onto a non-displaced end', () => {
        // moving inHome1 into foreign
        const endEdge: number = preset.inForeign2.page.borderBox[axis.end];
        const crossAxisCenter: number =
          preset.foreign.page.borderBox.center[axis.crossAxisLine];

        const onEnd: Position = patch(axis.line, endEdge, crossAxisCenter);
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: onEnd,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: preset.droppables,
          // no previous impact
          previousImpact: noImpact,
          viewport,
          userDirection: backward,
          onLift,
        });
        const newDisplaced: Displacement[] = [
          getVisibleDisplacement(preset.inForeign2),
          getVisibleDisplacement(preset.inForeign3),
          getVisibleDisplacement(preset.inForeign4),
        ];
        const newMap: DisplacementMap = getDisplacementMap(newDisplaced);
        const expected: DragImpact = {
          movement: {
            // ordered by closest to current location
            displaced: newDisplaced,
            map: newMap,
            displacedBy,
          },
          direction: axis.direction,
          destination: {
            droppableId: preset.foreign.descriptor.id,
            // in position of inForeign2
            index: preset.inForeign2.descriptor.index,
          },
          merge: null,
        };
        expect(impact).toEqual(expected);
      });
    });

    describe('within list', () => {
      const crossAxisCenter: number =
        preset.foreign.page.borderBox.center[axis.crossAxisLine];

      it('should remove displacement as moving forward over a displaced start edge', () => {
        const fromStart: Position = patch(
          axis.line,
          preset.foreign.page.borderBox[axis.start],
          crossAxisCenter,
        );
        const enterFromStart: DragImpact = getDragImpact({
          pageBorderBoxCenter: fromStart,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: preset.droppables,
          // no previous impact
          previousImpact: noImpact,
          viewport,
          userDirection: forward,
          onLift,
        });
        const everythingDisplaced: Displacement[] = [
          getVisibleDisplacement(preset.inForeign1),
          getVisibleDisplacement(preset.inForeign2),
          getVisibleDisplacement(preset.inForeign3),
          getVisibleDisplacement(preset.inForeign4),
        ];
        // validation
        {
          const map: DisplacementMap = getDisplacementMap(everythingDisplaced);
          const expected: DragImpact = {
            movement: {
              // ordered by closest to current location
              displaced: everythingDisplaced,
              map,
              displacedBy,
            },
            direction: axis.direction,
            destination: {
              // in first position
              droppableId: preset.foreign.descriptor.id,
              index: 0,
            },
            merge: null,
          };
          expect(enterFromStart).toEqual(expected);
        }

        // moving forward
        const startEdge: number = preset.inForeign1.page.borderBox[axis.start];
        const displacedStartEdge: number = withDisplacement(startEdge);
        // over start
        {
          const overStartEdge: Position = patch(
            axis.line,
            startEdge,
            crossAxisCenter,
          );
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: overStartEdge,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: preset.droppables,
            // no previous impact
            previousImpact: enterFromStart,
            viewport,
            userDirection: forward,
            onLift,
          });
          const map: DisplacementMap = getDisplacementMap(everythingDisplaced);
          const expected: DragImpact = {
            movement: {
              // ordered by closest to current location
              displaced: everythingDisplaced,
              map,
              displacedBy,
            },
            direction: axis.direction,
            destination: {
              // in first position
              droppableId: preset.foreign.descriptor.id,
              index: 0,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        }
        // on displaced start
        {
          const onDisplacedStart: Position = patch(
            axis.line,
            displacedStartEdge,
            crossAxisCenter,
          );
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: onDisplacedStart,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: preset.droppables,
            // no previous impact
            previousImpact: enterFromStart,
            viewport,
            userDirection: forward,
            onLift,
          });
          const map: DisplacementMap = getDisplacementMap(everythingDisplaced);
          const expected: DragImpact = {
            movement: {
              // ordered by closest to current location
              displaced: everythingDisplaced,
              map,
              displacedBy,
            },
            direction: axis.direction,
            destination: {
              // in first position
              droppableId: preset.foreign.descriptor.id,
              index: 0,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        }
        // over displaced start
        {
          const overDisplacedStart: Position = patch(
            axis.line,
            displacedStartEdge + 1,
            crossAxisCenter,
          );
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: overDisplacedStart,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: preset.droppables,
            // no previous impact
            previousImpact: enterFromStart,
            viewport,
            userDirection: forward,
            onLift,
          });
          const displaced: Displacement[] = [
            // inForeign1 no longer displaced
            getVisibleDisplacement(preset.inForeign2),
            getVisibleDisplacement(preset.inForeign3),
            getVisibleDisplacement(preset.inForeign4),
          ];
          const map: DisplacementMap = getDisplacementMap(displaced);
          const expected: DragImpact = {
            movement: {
              // ordered by closest to current location
              displaced,
              map,
              displacedBy,
            },
            direction: axis.direction,
            destination: {
              // after inForeign1
              droppableId: preset.foreign.descriptor.id,
              index: 1,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        }
        // over another displaced start (testing ordering)
        {
          const anotherDisplacedStartEdge: number =
            preset.inForeign2.page.borderBox[axis.start] +
            preset.inHome1.displaceBy[axis.line];
          const overDisplacedStart: Position = patch(
            axis.line,
            anotherDisplacedStartEdge + 1,
            crossAxisCenter,
          );
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: overDisplacedStart,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: preset.droppables,
            // no previous impact
            previousImpact: enterFromStart,
            viewport,
            userDirection: forward,
            onLift,
          });
          const displaced: Displacement[] = [
            // inForeign1 no longer displaced
            // inForeign2 no longer displaced
            getVisibleDisplacement(preset.inForeign3),
            getVisibleDisplacement(preset.inForeign4),
          ];
          const map: DisplacementMap = getDisplacementMap(displaced);
          const expected: DragImpact = {
            movement: {
              // ordered by closest to current location
              displaced,
              map,
              displacedBy,
            },
            direction: axis.direction,
            destination: {
              // after inForeign2
              droppableId: preset.foreign.descriptor.id,
              index: 2,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        }
      });

      it('should increase displacement moving backwards over non displaced end edge', () => {
        const fromEnd: Position = patch(
          axis.line,
          preset.foreign.page.borderBox[axis.end],
          crossAxisCenter,
        );
        const enterFromEnd: DragImpact = getDragImpact({
          pageBorderBoxCenter: fromEnd,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: preset.droppables,
          // no previous impact
          previousImpact: noImpact,
          viewport,
          userDirection: backward,
          onLift,
        });

        // validation
        {
          const expected: DragImpact = {
            movement: {
              // nothing displaced
              displaced: [],
              map: {},
              displacedBy,
            },
            direction: axis.direction,
            destination: {
              // after last item
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeignList.length,
            },
            merge: null,
          };
          expect(enterFromEnd).toEqual(expected);
        }
        // moving onto end edge of item before
        {
          const afterEndEdge: Position = patch(
            axis.line,
            preset.inForeign4.page.borderBox[axis.end] + 1,
            crossAxisCenter,
          );
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: afterEndEdge,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: preset.droppables,
            // no previous impact
            previousImpact: enterFromEnd,
            viewport,
            userDirection: backward,
            onLift,
          });
          const expected: DragImpact = {
            movement: {
              // nothing displaced
              displaced: [],
              map: {},
              displacedBy,
            },
            direction: axis.direction,
            destination: {
              // after last item
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeignList.length,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        }
        // moving onto end edge of item before
        {
          const onEnd: Position = patch(
            axis.line,
            preset.inForeign4.page.borderBox[axis.end],
            crossAxisCenter,
          );
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: onEnd,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: preset.droppables,
            // no previous impact
            previousImpact: enterFromEnd,
            viewport,
            userDirection: backward,
            onLift,
          });

          const displaced: Displacement[] = [
            getVisibleDisplacement(preset.inForeign4),
          ];
          const expected: DragImpact = {
            movement: {
              // nothing displaced
              displaced,
              map: getDisplacementMap(displaced),
              displacedBy,
            },
            direction: axis.direction,
            destination: {
              // in position of inForeign4
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign4.descriptor.index,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        }
        // moving over edge of another item (testing ordering)
        {
          const beforeEndEdge: Position = patch(
            axis.line,
            preset.inForeign3.page.borderBox[axis.end] - 1,
            crossAxisCenter,
          );
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: beforeEndEdge,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: preset.droppables,
            previousImpact: enterFromEnd,
            viewport,
            userDirection: backward,
            onLift,
          });

          // ordered by closest impact
          const displaced: Displacement[] = [
            getVisibleDisplacement(preset.inForeign3),
            getVisibleDisplacement(preset.inForeign4),
          ];
          const expected: DragImpact = {
            movement: {
              // nothing displaced
              displaced,
              map: getDisplacementMap(displaced),
              displacedBy,
            },
            direction: axis.direction,
            destination: {
              // in position of inForeign3
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign3.descriptor.index,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        }
      });
    });
  });
});
