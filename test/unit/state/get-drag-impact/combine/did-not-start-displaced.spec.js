// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  DisplacedBy,
  DroppableDimensionMap,
  Displacement,
} from '../../../../../src/types';
import { vertical, horizontal } from '../../../../../src/state/axis';
import { getPreset, enableCombining } from '../../../../utils/dimension';
import {
  forward,
  backward,
} from '../../../../../src/state/user-direction/user-direction-preset';
import getDragImpact from '../../../../../src/state/get-drag-impact';
import getDisplacedBy from '../../../../../src/state/get-displaced-by';
import { patch, subtract, add } from '../../../../../src/state/position';
import getDisplacementMap from '../../../../../src/state/get-displacement-map';
import getHomeOnLift from '../../../../../src/state/get-home-on-lift';
import afterPoint from '../../../../utils/after-point';
import beforePoint from '../../../../utils/before-point';
import getVisibleDisplacement from '../../../../utils/get-displacement/get-visible-displacement';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const { onLift } = getHomeOnLift({
      draggable: preset.inHome1,
      home: preset.home,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });
    const withCombineEnabled: DroppableDimensionMap = enableCombining(
      preset.droppables,
    );
    // will be over a foreign list for these tests
    const crossAxisCenter: number =
      preset.foreign.page.borderBox.center[axis.crossAxisLine];

    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome1.displaceBy,
    );

    const whenEnteredForeign: DragImpact = (() => {
      const displaced: Displacement[] = [
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const impact: DragImpact = {
        movement: {
          displaced,
          map: getDisplacementMap(displaced),
          displacedBy,
        },
        // in position of inForeign3
        destination: {
          index: preset.inForeign3.descriptor.index,
          droppableId: preset.inForeign3.descriptor.droppableId,
        },
        merge: null,
      };
      return impact;
    })();

    // moving onto a displaced inForeign3
    describe('combining with displaced item', () => {
      const startOfInForeign3: Position = patch(
        axis.line,
        preset.inForeign3.page.borderBox[axis.start],
        crossAxisCenter,
      );
      const onDisplacedStartOfInForeign3: Position = add(
        startOfInForeign3,
        displacedBy.point,
      );
      const onDisplacedTwoThirdsOfInForeign3: Position = add(
        onDisplacedStartOfInForeign3,
        patch(axis.line, preset.inForeign3.page.borderBox[axis.size] * 0.666),
      );

      const combineWithDisplacedInForeign3: DragImpact = (() => {
        const displaced: Displacement[] = [
          // inForeign3 is still displaced - we are just merging with it
          getVisibleDisplacement(preset.inForeign3),
          getVisibleDisplacement(preset.inForeign4),
        ];
        const impact: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          destination: null,
          // now merging with inForeign3
          merge: {
            whenEntered: forward,
            combine: {
              draggableId: preset.inForeign3.descriptor.id,
              droppableId: preset.inForeign3.descriptor.droppableId,
            },
          },
        };
        return impact;
      })();

      it('should combine when moving forward onto a displaced start edge', () => {
        // it should not merge when before the item
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: beforePoint(
              onDisplacedStartOfInForeign3,
              axis,
            ),
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: whenEnteredForeign,
            viewport: preset.viewport,
            userDirection: forward,
            onLift,
          });
          expect(impact).toEqual(whenEnteredForeign);
        }
        // it should merge with the item when it goes onto the displaced start
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: onDisplacedStartOfInForeign3,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: whenEnteredForeign,
            viewport: preset.viewport,
            userDirection: forward,
            onLift,
          });
          expect(impact).toEqual(combineWithDisplacedInForeign3);
        }
      });

      it('should no longer merge when moving out of the first 2/3 of the target', () => {
        // merge when still in on two thirds
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: onDisplacedTwoThirdsOfInForeign3,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: whenEnteredForeign,
            viewport: preset.viewport,
            userDirection: forward,
            onLift,
          });
          expect(impact).toEqual(combineWithDisplacedInForeign3);
        }
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: afterPoint(
              onDisplacedTwoThirdsOfInForeign3,
              axis,
            ),
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: whenEnteredForeign,
            viewport: preset.viewport,
            userDirection: forward,
            onLift,
          });
          const displaced: Displacement[] = [
            getVisibleDisplacement(preset.inForeign4),
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              displacedBy,
            },
            // now in spot of inForeign4
            destination: {
              index: preset.inForeign4.descriptor.index,
              droppableId: preset.inForeign4.descriptor.droppableId,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        }
      });

      it('should allow movement in any direction when in the first 2/3 and still combine', () => {
        const initial: DragImpact = getDragImpact({
          pageBorderBoxCenter: onDisplacedStartOfInForeign3,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: whenEnteredForeign,
          viewport: preset.viewport,
          userDirection: forward,
          onLift,
        });
        expect(initial).toEqual(combineWithDisplacedInForeign3);
        // on start edge, but in backward direction
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: onDisplacedStartOfInForeign3,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: initial,
            viewport: preset.viewport,
            userDirection: backward,
            onLift,
          });
          expect(impact).toEqual(combineWithDisplacedInForeign3);
        }
        // on displaced edge, but in backward direction
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: onDisplacedTwoThirdsOfInForeign3,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: initial,
            viewport: preset.viewport,
            userDirection: backward,
            onLift,
          });
          expect(impact).toEqual(combineWithDisplacedInForeign3);
        }
        // on displaced edge, but in backward direction
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: beforePoint(
              onDisplacedTwoThirdsOfInForeign3,
              axis,
            ),
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: initial,
            viewport: preset.viewport,
            userDirection: backward,
            onLift,
          });
          expect(impact).toEqual(combineWithDisplacedInForeign3);
        }
      });
    });

    // moving onto a non-displaced inForeign2
    describe('combining with non-displaced item', () => {
      const endOfInForeign2: Position = patch(
        axis.line,
        preset.inForeign2.page.borderBox[axis.end],
        crossAxisCenter,
      );
      const onOneThirdOfInForeign2: Position = subtract(
        endOfInForeign2,
        patch(axis.line, preset.inForeign2.page.borderBox[axis.size] * 0.666),
      );
      const combineWithInForeign2: DragImpact = (() => {
        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inForeign3),
          getVisibleDisplacement(preset.inForeign4),
        ];
        const impact: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          destination: null,
          // now merging with inForeign2
          merge: {
            whenEntered: backward,
            combine: {
              draggableId: preset.inForeign2.descriptor.id,
              droppableId: preset.inForeign2.descriptor.droppableId,
            },
          },
        };
        return impact;
      })();

      it('should combine with an item when moving backwards onto the end edge', () => {
        // before is not far enough
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: afterPoint(endOfInForeign2, axis),
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: whenEnteredForeign,
            viewport: preset.viewport,
            userDirection: backward,
            onLift,
          });
          expect(impact).toEqual(whenEnteredForeign);
        }
        // on edge is enough
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: endOfInForeign2,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: whenEnteredForeign,
            viewport: preset.viewport,
            userDirection: backward,
            onLift,
          });
          expect(impact).toEqual(combineWithInForeign2);
        }
      });

      it('should stop combining when going back 2/3 of the size', () => {
        // on top 1/3 line is good
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: onOneThirdOfInForeign2,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: whenEnteredForeign,
            viewport: preset.viewport,
            userDirection: backward,
            onLift,
          });
          expect(impact).toEqual(combineWithInForeign2);
        }
        // past 1/3 top line is too far
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: beforePoint(onOneThirdOfInForeign2, axis),
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: whenEnteredForeign,
            viewport: preset.viewport,
            userDirection: backward,
            onLift,
          });
          const displaced: Displacement[] = [
            getVisibleDisplacement(preset.inForeign2),
            getVisibleDisplacement(preset.inForeign3),
            getVisibleDisplacement(preset.inForeign4),
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              displacedBy,
            },
            destination: {
              index: preset.inForeign2.descriptor.index,
              droppableId: preset.inForeign2.descriptor.droppableId,
            },
            merge: null,
          };
          expect(impact).toEqual(expected);
        }
      });

      it('should continue to combine when forward movements are made after entering the bottom 2/3', () => {
        const initial: DragImpact = getDragImpact({
          pageBorderBoxCenter: endOfInForeign2,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: whenEnteredForeign,
          viewport: preset.viewport,
          userDirection: backward,
          onLift,
        });
        expect(initial).toEqual(combineWithInForeign2);
        // forward movement on bottom edge
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: endOfInForeign2,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: initial,
            viewport: preset.viewport,
            userDirection: forward,
            onLift,
          });
          expect(impact).toEqual(combineWithInForeign2);
        }
        // forward on 1/3 edge
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: onOneThirdOfInForeign2,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: initial,
            viewport: preset.viewport,
            userDirection: forward,
            onLift,
          });
          expect(impact).toEqual(combineWithInForeign2);
        }
        // forward in the grouping range
        {
          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter: afterPoint(onOneThirdOfInForeign2, axis),
            draggable: preset.inHome1,
            draggables: preset.draggables,
            droppables: withCombineEnabled,
            previousImpact: initial,
            viewport: preset.viewport,
            userDirection: forward,
            onLift,
          });
          expect(impact).toEqual(combineWithInForeign2);
        }
      });
    });
  });
});
