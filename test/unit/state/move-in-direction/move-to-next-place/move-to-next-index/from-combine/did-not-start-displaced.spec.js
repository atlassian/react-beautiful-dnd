// @flow
import type {
  Axis,
  DragImpact,
  Displacement,
  DroppableDimension,
} from '../../../../../../../src/types';
import { vertical, horizontal } from '../../../../../../../src/state/axis';
import {
  forward,
  backward,
} from '../../../../../../../src/state/user-direction/user-direction-preset';
import { getPreset } from '../../../../../../utils/dimension';
import moveToNextIndex from '../../../../../../../src/state/move-in-direction/move-to-next-place/move-to-next-index/index';
import getDisplacedBy from '../../../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../../../src/state/get-displacement-map';
import getVisibleDisplacement from '../../../../../../utils/get-displacement/get-visible-displacement';
import getHomeOnLift from '../../../../../../../src/state/get-home-on-lift';

const enableCombine = (droppable: DroppableDimension): DroppableDimension => ({
  ...droppable,
  isCombineEnabled: true,
});

[vertical, horizontal].forEach((axis: Axis) => {
  const preset = getPreset(axis);
  describe(`on ${axis.direction} axis`, () => {
    it('should move forward off combining with is displaced', () => {
      // Setup: inHome1 combining with inForeign1 and then moving forward past it
      // Expected: inHome1 moves after inForeign1 and inForeign1 is no longer displaced
      const { onLift } = getHomeOnLift({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const initial: Displacement[] = [
        getVisibleDisplacement(preset.inForeign1),
        getVisibleDisplacement(preset.inForeign2),
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const combining: DragImpact = {
        movement: {
          displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
          displaced: initial,
          map: getDisplacementMap(initial),
        },
        merge: {
          whenEntered: forward,
          combine: {
            draggableId: preset.inForeign1.descriptor.id,
            droppableId: preset.foreign.descriptor.id,
          },
        },
        destination: null,
      };

      const result: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: enableCombine(preset.foreign),
        insideDestination: preset.inForeignList,
        previousImpact: combining,
        onLift,
      });

      const displaced: Displacement[] = [
        // inForeign1 no longer displaced
        getVisibleDisplacement(preset.inForeign2),
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const expected: DragImpact = {
        movement: {
          displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
          displaced,
          map: getDisplacementMap(displaced),
        },
        merge: null,
        destination: {
          index: preset.inForeign2.descriptor.index,
          droppableId: preset.foreign.descriptor.id,
        },
      };
      expect(result).toEqual(expected);
    });

    it('should move backward off combining with is displaced', () => {
      // Setup: inHome1 combining with inForeign1 and then moving backward before it
      // Expected: inHome1 goes before inForeign1 and displacement is not changed
      const { onLift } = getHomeOnLift({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const initial: Displacement[] = [
        getVisibleDisplacement(preset.inForeign1),
        getVisibleDisplacement(preset.inForeign2),
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const combining: DragImpact = {
        movement: {
          displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
          displaced: initial,
          map: getDisplacementMap(initial),
        },
        merge: {
          whenEntered: forward,
          combine: {
            draggableId: preset.inForeign1.descriptor.id,
            droppableId: preset.foreign.descriptor.id,
          },
        },
        destination: null,
      };

      const result: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: enableCombine(preset.foreign),
        insideDestination: preset.inForeignList,
        previousImpact: combining,
        onLift,
      });

      const expected: DragImpact = {
        ...combining,
        merge: null,
        destination: {
          index: preset.inForeign1.descriptor.index,
          droppableId: preset.foreign.descriptor.id,
        },
      };
      expect(result).toEqual(expected);
    });

    it('should move forward off combining with a non-displaced item', () => {
      // Setup
      // - inHome1 past inForeign1
      // - inHome1 moves backwards onto inForeign1
      // - inHome1 moves forwards off inForeign1
      // Expected
      // - inHome1 moves before inForeign1
      // - inForeign1 becomes displaced
      const { onLift } = getHomeOnLift({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const initial: Displacement[] = [
        // inForeign1 is not displaced
        getVisibleDisplacement(preset.inForeign2),
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const combining: DragImpact = {
        movement: {
          displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
          displaced: initial,
          map: getDisplacementMap(initial),
        },
        merge: {
          // moved backward onto inForeign1
          whenEntered: backward,
          combine: {
            draggableId: preset.inForeign1.descriptor.id,
            droppableId: preset.foreign.descriptor.id,
          },
        },
        destination: null,
      };

      const result: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: enableCombine(preset.foreign),
        insideDestination: preset.inForeignList,
        previousImpact: combining,
        onLift,
      });

      const displaced: Displacement[] = [
        // inForeign1 still not displaced
        getVisibleDisplacement(preset.inForeign2),
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const expected: DragImpact = {
        movement: {
          displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
          displaced,
          map: getDisplacementMap(displaced),
        },
        merge: null,
        destination: {
          index: preset.inForeign2.descriptor.index,
          droppableId: preset.foreign.descriptor.id,
        },
      };

      expect(result).toEqual(expected);
    });

    it('should move backward off combining with a non-displaced item', () => {
      // Setup
      // - inHome1 past inForeign1
      // - inHome1 moves backwards onto inForeign1
      // - inHome1 moves backwards off inForeign1
      // Expected
      // - inHome1 moves forward off inForeign1
      // - no displacement changes
      const { onLift } = getHomeOnLift({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const initial: Displacement[] = [
        // inForeign1 not displaced
        getVisibleDisplacement(preset.inForeign2),
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const combining: DragImpact = {
        movement: {
          displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
          displaced: initial,
          map: getDisplacementMap(initial),
        },
        merge: {
          // moved backward onto inForeign1
          whenEntered: backward,
          combine: {
            draggableId: preset.inForeign1.descriptor.id,
            droppableId: preset.foreign.descriptor.id,
          },
        },
        destination: null,
      };

      const result: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: enableCombine(preset.foreign),
        insideDestination: preset.inForeignList,
        previousImpact: combining,
        onLift,
      });

      const displaced: Displacement[] = [
        // inForeign1 now displaced
        getVisibleDisplacement(preset.inForeign1),
        getVisibleDisplacement(preset.inForeign2),
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const expected: DragImpact = {
        movement: {
          displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
          displaced,
          map: getDisplacementMap(displaced),
        },
        merge: null,
        destination: {
          index: preset.inForeign1.descriptor.index,
          droppableId: preset.foreign.descriptor.id,
        },
      };
      expect(result).toEqual(expected);
    });
  });
});
