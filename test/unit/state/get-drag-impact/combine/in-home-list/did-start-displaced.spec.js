// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  DisplacedBy,
  DroppableDimensionMap,
  Displacement,
} from '../../../../../../src/types';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import { getPreset, enableCombining } from '../../../../../utils/dimension';
import {
  forward,
  backward,
} from '../../../../../../src/state/user-direction/user-direction-preset';
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import { patch, subtract, add } from '../../../../../../src/state/position';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import getHomeOnLift from '../../../../../../src/state/get-home-on-lift';
import getNotAnimatedDisplacement from '../../../../../utils/get-displacement/get-not-animated-displacement';
import getVisibleDisplacement from '../../../../../utils/get-displacement/get-visible-displacement';

[vertical /* , horizontal */].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const beforePoint = (point: Position) =>
      subtract(point, patch(axis.line, 1));
    const afterPoint = (point: Position) => add(point, patch(axis.line, 1));

    const { onLift, impact: homeImpact } = getHomeOnLift({
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
    const combineWithInHome3Impact: DragImpact = (() => {
      // ordered by closest to current location
      const displaced: Displacement[] = [
        // displaced is not animated as it was the starting displacement
        getNotAnimatedDisplacement(preset.inHome3),
        getNotAnimatedDisplacement(preset.inHome4),
      ];
      const impact: DragImpact = {
        movement: {
          displaced,
          map: getDisplacementMap(displaced),
          displacedBy,
        },
        direction: axis.direction,
        destination: null,
        merge: {
          whenEntered: forward,
          combine: {
            draggableId: preset.inHome3.descriptor.id,
            droppableId: preset.inHome3.descriptor.droppableId,
          },
        },
      };
      return impact;
    })();

    // moving onto inHome2
    it('should move forward onto an item that started displaced', () => {
      // before start of inHome3
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
          previousImpact: homeImpact,
          viewport: preset.viewport,
          userDirection: forward,
          onLift,
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
          onLift,
        });

        expect(impact).toEqual(combineWithInHome3Impact);
      }
    });

    const onTwoThirdsOfInHome3: Position = add(
      startOfInHome3,
      patch(axis.line, preset.inHome3.page.borderBox[axis.size] * 0.666),
    );
    const beforeOnTwoThirdsOfInHome3: Position = subtract(
      onTwoThirdsOfInHome3,
      patch(axis.line, 1),
    );
    const afterTwoThirdsOfInHome3: Position = add(
      onTwoThirdsOfInHome3,
      patch(axis.line, 1),
    );

    it('should remain displaced when moving forward in the first two thirds of the target', () => {
      // before onTwoThirds - still should merge
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforeOnTwoThirdsOfInHome3,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          userDirection: forward,
          onLift,
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
          onLift,
        });

        expect(impact).toEqual(combineWithInHome3Impact);
      }
      // after two thirds - should reorder
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: afterTwoThirdsOfInHome3,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: homeImpact,
          viewport: preset.viewport,
          userDirection: forward,
          onLift,
        });

        // ordered by closest to current location
        const displaced: Displacement[] = [
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          direction: axis.direction,
          // now in position of inHome3
          destination: {
            index: preset.inHome3.descriptor.index,
            droppableId: preset.inHome3.descriptor.droppableId,
          },
          // no merge yet
          merge: null,
        };
        expect(impact).toEqual(expected);
      }
    });

    it('should remain displaced when moving backwards in the first two thirds of the target', () => {
      // before onTwoThirds and moving backwards - still should merge
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: beforeOnTwoThirdsOfInHome3,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: combineWithInHome3Impact,
          viewport: preset.viewport,
          userDirection: backward,
          onLift,
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
          onLift,
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
          onLift,
        });

        // ordered by closest to current location
        // would normally expect inHome3 to be displaced,
        // however, in this case it will move backwards
        // because the center position is bigger
        // than the displaced bottom edge of inHome3

        const displaced: Displacement[] = [
          // keeping original not animated displacement
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          direction: axis.direction,
          destination: {
            // in the visual spot of inHome3
            index: preset.inHome3.descriptor.index,
            droppableId: preset.inHome3.descriptor.droppableId,
          },
          // no merge yet
          merge: null,
        };
        expect(impact).toEqual(expected);
      }
    });

    const onDisplacedEndOfInHome3: Position = patch(
      axis.line,
      preset.inHome3.page.borderBox[axis.end] - displacedBy.value,
      crossAxisCenter,
    );
    const afterDisplacedEndOfInHome3: Position = add(
      onDisplacedEndOfInHome3,
      patch(axis.line, 1),
    );
    const combineWithDisplacedInHome3Impact: DragImpact = (() => {
      const displaced: Displacement[] = [
        // inHome3 is not displaced. It is visibly displaced as the initial displacement has been removed
        getNotAnimatedDisplacement(preset.inHome4),
      ];
      const impact: DragImpact = {
        movement: {
          displaced,
          map: getDisplacementMap(displaced),
          displacedBy,
        },
        direction: axis.direction,
        destination: null,
        // merging with visibly displaced inHome3
        merge: {
          whenEntered: backward,
          combine: {
            draggableId: preset.inHome3.descriptor.id,
            droppableId: preset.inHome3.descriptor.droppableId,
          },
        },
      };
      return impact;
    })();

    // dragging inHome2 forward past inHome3 and then back onto inhome3
    it('should move backwards onto an item that was displaced but no longer is', () => {
      const first: DragImpact = getDragImpact({
        pageBorderBoxCenter: afterTwoThirdsOfInHome3,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        droppables: withCombineEnabled,
        previousImpact: homeImpact,
        viewport: preset.viewport,
        userDirection: forward,
        onLift,
      });
      // have moved past merging with inHome3
      {
        // ordered by closest to current location
        const displaced: Displacement[] = [
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          direction: axis.direction,
          // now in position of inHome3
          destination: {
            index: preset.inHome3.descriptor.index,
            droppableId: preset.inHome3.descriptor.droppableId,
          },
          // no merge yet
          merge: null,
        };
        expect(first).toEqual(expected);
      }
      // moving backwards to merge with inHome3 that is backwards from its resting position
      // not quite moved backwards enough
      {
        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: afterDisplacedEndOfInHome3,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          droppables: withCombineEnabled,
          previousImpact: first,
          viewport: preset.viewport,
          userDirection: backward,
          onLift,
        });
        expect(impact.merge).toBe(null);
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
          onLift,
        });

        expect(impact).toEqual(combineWithDisplacedInHome3Impact);
      }
    });

    const onTwoThirdsFromDisplacedEnd: Position = subtract(
      onDisplacedEndOfInHome3,
      patch(axis.line, preset.inHome3.page.borderBox[axis.size] * 0.666),
    );

    it('should remain displaced when when in the last two thirds of the visibly displaced target', () => {
      const impact: DragImpact = getDragImpact({
        pageBorderBoxCenter: afterDisplacedEndOfInHome3,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        droppables: withCombineEnabled,
        previousImpact: combineWithDisplacedInHome3Impact,
        viewport: preset.viewport,
        userDirection: backward,
        onLift,
      });
    });
  });
});
