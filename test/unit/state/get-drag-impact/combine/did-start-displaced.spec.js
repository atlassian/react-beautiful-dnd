// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  DisplacedBy,
  DroppableDimensionMap,
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
import getLiftEffect from '../../../../../src/state/get-lift-effect';
import afterPoint from '../../../../utils/after-point';
import beforePoint from '../../../../utils/before-point';
import { getForcedDisplacement } from '../../../../utils/impact';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    const { afterCritical, impact: homeImpact } = getLiftEffect({
      draggable: preset.inHome2,
      home: preset.home,
      draggables: preset.draggables,
      viewport: preset.viewport,
    });
    const withCombineEnabled: DroppableDimensionMap = enableCombining(
      preset.droppables,
    );
    const crossAxisCenter: number =
      preset.home.page.borderBox.center[axis.crossAxisLine];

    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome2.displaceBy,
    );
    const startOfInHome3: Position = patch(
      axis.line,
      preset.inHome3.page.borderBox[axis.start],
      crossAxisCenter,
    );
    const combineWithInHome3Impact: DragImpact = {
      displaced: getForcedDisplacement({
        // ordered by closest to current location
        // displaced is not animated as it was the starting displacement
        visible: [
          { dimension: preset.inHome3, shouldAnimate: false },
          { dimension: preset.inHome4, shouldAnimate: false },
        ],
      }),
      displacedBy,
      at: {
        type: 'COMBINE',
        whenEntered: forward,
        combine: {
          draggableId: preset.inHome3.descriptor.id,
          droppableId: preset.inHome3.descriptor.droppableId,
        },
      },
    };

    // moving onto inHome2
    it('should move forward onto an item that started displaced', () => {
      // before start of inHome3
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforePoint(startOfInHome3, axis),
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          userDirection: forward,
          afterCritical,
        });

        expect(impact).toEqual(homeImpact);
      }
      // on start of inhome3 - now should merge
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: startOfInHome3,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          userDirection: forward,
          afterCritical,
        });

        expect(impact).toEqual(combineWithInHome3Impact);
      }
    });

    const onTwoThirdsOfInHome3: Position = add(
      startOfInHome3,
      patch(axis.line, preset.inHome3.page.borderBox[axis.size] * 0.666),
    );

    it('should remain displaced when moving forward in the first two thirds of the target', () => {
      // before onTwoThirds - still should merge
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforePoint(onTwoThirdsOfInHome3, axis),
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          userDirection: forward,
          afterCritical,
        });

        expect(impact).toEqual(combineWithInHome3Impact);
      }
      // onTwoThirds - still should merge
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: onTwoThirdsOfInHome3,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          userDirection: forward,
          afterCritical,
        });

        expect(impact).toEqual(combineWithInHome3Impact);
      }
      // after two thirds - should reorder
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: afterPoint(onTwoThirdsOfInHome3, axis),
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          userDirection: forward,
          afterCritical,
        });

        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [{ dimension: preset.inHome4, shouldAnimate: false }],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            // now in position of inHome3
            destination: {
              index: preset.inHome3.descriptor.index,
              droppableId: preset.inHome3.descriptor.droppableId,
            },
          },
        };
        expect(impact).toEqual(expected);
      }
    });

    it('should remain displaced when moving backwards in the first two thirds of the target', () => {
      // before onTwoThirds and moving backwards - still should merge
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforePoint(onTwoThirdsOfInHome3, axis),
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: combineWithInHome3Impact,
          viewport: preset.viewport,
          userDirection: backward,
          afterCritical,
        });

        expect(impact).toEqual(combineWithInHome3Impact);
      }
      // on start and moving backwards - still should merge
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: startOfInHome3,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: combineWithInHome3Impact,
          viewport: preset.viewport,
          userDirection: backward,
          afterCritical,
        });

        expect(impact).toEqual(combineWithInHome3Impact);
      }
      // moving backwards past the start of inHome3, will no longer merge
      // moving back to home position
      {
        const beforeStartOfInHome3: Position = subtract(
          startOfInHome3,
          patch(axis.line, 1),
        );

        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforeStartOfInHome3,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: combineWithInHome3Impact,
          viewport: preset.viewport,
          userDirection: backward,
          afterCritical,
        });

        // ordered by closest to current location
        // would normally expect inHome3 to be displaced,
        // however, in this case it will move backwards
        // because the center position is bigger
        // than the displaced bottom edge of inHome3

        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [
              // keeping original not animated displacement
              { dimension: preset.inHome4, shouldAnimate: false },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              // in the visual spot of inHome3
              index: preset.inHome3.descriptor.index,
              droppableId: preset.inHome3.descriptor.droppableId,
            },
          },
        };
        expect(impact).toEqual(expected);
      }
    });

    const onDisplacedEndOfInHome3: Position = patch(
      axis.line,
      preset.inHome3.page.borderBox[axis.end] - displacedBy.value,
      crossAxisCenter,
    );
    const combineWithDisplacedInHome3Impact: DragImpact = {
      displaced: getForcedDisplacement({
        visible: [
          // inHome3 is not displaced. It is visibly displaced as the initial displacement has been removed
          { dimension: preset.inHome4, shouldAnimate: false },
        ],
      }),
      displacedBy,
      at: {
        type: 'COMBINE',
        whenEntered: backward,
        combine: {
          draggableId: preset.inHome3.descriptor.id,
          droppableId: preset.inHome3.descriptor.droppableId,
        },
      },
    };

    // dragging inHome2 forward past inHome3 and then back onto inhome3
    it('should move backwards onto an item that was displaced but no longer is', () => {
      const first: DragImpact = getDragImpact({
        pageBorderBoxCenter: afterPoint(onTwoThirdsOfInHome3, axis),
        draggable: preset.inHome2,
        draggables: preset.draggables,
        droppables: withCombineEnabled,
        previousImpact: homeImpact,
        viewport: preset.viewport,
        userDirection: forward,
        afterCritical,
      });
      // have moved past merging with inHome3
      {
        // ordered by closest to current location
        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [{ dimension: preset.inHome4, shouldAnimate: false }],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            // now in position of inHome3
            destination: {
              index: preset.inHome3.descriptor.index,
              droppableId: preset.inHome3.descriptor.droppableId,
            },
          },
        };
        expect(first).toEqual(expected);
      }
      // moving backwards to merge with inHome3 that is backwards from its resting position
      // not quite moved backwards enough
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: afterPoint(onDisplacedEndOfInHome3, axis),
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: first,
          viewport: preset.viewport,
          userDirection: backward,
          afterCritical,
        });
        expect(impact.at).toHaveProperty('type', 'REORDER');
      }
      // moved back enough to combine with visibly displaced inHome3
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: onDisplacedEndOfInHome3,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: first,
          viewport: preset.viewport,
          userDirection: backward,
          afterCritical,
        });

        expect(impact).toEqual(combineWithDisplacedInHome3Impact);
      }
    });

    const onTwoThirdsFromDisplacedEnd: Position = subtract(
      onDisplacedEndOfInHome3,
      patch(axis.line, preset.inHome3.page.borderBox[axis.size] * 0.666),
    );

    it('should remain displaced when when in the last two thirds of the visibly displaced target', () => {
      // right up to the edge
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: onTwoThirdsFromDisplacedEnd,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: combineWithDisplacedInHome3Impact,
          viewport: preset.viewport,
          userDirection: backward,
          afterCritical,
        });
        expect(impact).toEqual(combineWithDisplacedInHome3Impact);
      }
      // before edge we are no longer merging
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforePoint(onTwoThirdsFromDisplacedEnd, axis),
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: combineWithDisplacedInHome3Impact,
          viewport: preset.viewport,
          userDirection: backward,
          afterCritical,
        });
        expect(impact.at).not.toHaveProperty('COMBINE');
      }
    });

    it('should remain displaced when moving forward last two thirds of the visibly displaced target', () => {
      // right up to the edge
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: onTwoThirdsFromDisplacedEnd,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: combineWithDisplacedInHome3Impact,
          viewport: preset.viewport,
          userDirection: forward,
          afterCritical,
        });
        expect(impact).toEqual(combineWithDisplacedInHome3Impact);
      }
      // before edge we are no longer merging
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: afterPoint(onTwoThirdsFromDisplacedEnd, axis),
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: combineWithDisplacedInHome3Impact,
          viewport: preset.viewport,
          userDirection: forward,
          afterCritical,
        });
        expect(impact).toEqual(combineWithDisplacedInHome3Impact);
      }
    });
  });
});
