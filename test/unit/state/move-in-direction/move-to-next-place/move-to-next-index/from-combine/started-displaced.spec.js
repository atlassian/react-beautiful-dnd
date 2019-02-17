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
import getNotAnimatedDisplacement from '../../../../../../utils/get-displacement/get-not-animated-displacement';
import getVisibleDisplacement from '../../../../../../utils/get-displacement/get-visible-displacement';
import getHomeOnLift from '../../../../../../../src/state/get-home-on-lift';

const enableCombine = (droppable: DroppableDimension): DroppableDimension => ({
  ...droppable,
  isCombineEnabled: true,
});

[vertical, horizontal].forEach((axis: Axis) => {
  const preset = getPreset(axis);
  describe(`on ${axis.direction} axis`, () => {
    it('should move backward off combining with an item that is displaced', () => {
      // inHome2 combining with inHome3
      const { onLift, impact: homeImpact } = getHomeOnLift({
        draggable: preset.inHome2,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const combining: DragImpact = {
        ...homeImpact,
        destination: null,
        merge: {
          whenEntered: forward,
          combine: {
            draggableId: preset.inHome3.descriptor.id,
            droppableId: preset.home.descriptor.id,
          },
        },
      };

      const result: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: combining,
        onLift,
      });

      expect(result).toEqual(homeImpact);
    });

    it('should move forward past a combining an item that is displaced', () => {
      // inHome2 combining with inHome3
      const { onLift, impact: homeImpact } = getHomeOnLift({
        draggable: preset.inHome2,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const combining: DragImpact = {
        ...homeImpact,
        destination: null,
        merge: {
          whenEntered: forward,
          combine: {
            draggableId: preset.inHome3.descriptor.id,
            droppableId: preset.home.descriptor.id,
          },
        },
      };

      const result: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: combining,
        onLift,
      });

      const displaced: Displacement[] = [
        // inHome3 now displaced
        getNotAnimatedDisplacement(preset.inHome4),
      ];
      const expected: DragImpact = {
        movement: {
          displacedBy: getDisplacedBy(axis, preset.inHome2.displaceBy),
          displaced,
          map: getDisplacementMap(displaced),
        },
        direction: axis.direction,
        merge: null,
        destination: {
          index: preset.inHome3.descriptor.index,
          droppableId: preset.home.descriptor.id,
        },
      };
      expect(result).toEqual(expected);
    });

    it('should move backwards past combining with an item that started displaced - but now is not', () => {
      // inHome2 moved past inHome3 and then backwards onto it
      const { onLift } = getHomeOnLift({
        draggable: preset.inHome2,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });

      const displaced: Displacement[] = [
        // preset.inHome3 is no longer displaced
        getNotAnimatedDisplacement(preset.inHome4),
      ];
      const combining: DragImpact = {
        movement: {
          displacedBy: getDisplacedBy(axis, preset.inHome2.displaceBy),
          displaced,
          map: getDisplacementMap(displaced),
        },
        direction: axis.direction,
        destination: null,
        merge: {
          whenEntered: backward,
          combine: {
            draggableId: preset.inHome3.descriptor.id,
            droppableId: preset.home.descriptor.id,
          },
        },
      };

      const result: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: combining,
        onLift,
      });

      // backwards movement should displace inHome3
      const newDisplaced: Displacement[] = [
        // inHome3 now displaced
        getVisibleDisplacement(preset.inHome3),
        getNotAnimatedDisplacement(preset.inHome4),
      ];
      const expected: DragImpact = {
        movement: {
          displacedBy: getDisplacedBy(axis, preset.inHome2.displaceBy),
          displaced: newDisplaced,
          map: getDisplacementMap(newDisplaced),
        },
        direction: axis.direction,
        destination: {
          index: preset.inHome2.descriptor.index,
          droppableId: preset.home.descriptor.id,
        },
        merge: null,
      };
      expect(result).toEqual(expected);
    });

    it('should move forwards past combining with an item that started displaced - but now is not', () => {
      // inHome2 moved past inHome3 and then backwards onto it
      const { onLift } = getHomeOnLift({
        draggable: preset.inHome2,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });

      const displaced: Displacement[] = [
        // preset.inHome3 is no longer displaced
        getNotAnimatedDisplacement(preset.inHome4),
      ];
      const combining: DragImpact = {
        movement: {
          displacedBy: getDisplacedBy(axis, preset.inHome2.displaceBy),
          displaced,
          map: getDisplacementMap(displaced),
        },
        direction: axis.direction,
        destination: null,
        merge: {
          whenEntered: backward,
          combine: {
            draggableId: preset.inHome3.descriptor.id,
            droppableId: preset.home.descriptor.id,
          },
        },
      };

      const result: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: combining,
        onLift,
      });

      // forwards movement off inHome3. It will leave inHome3 in the same spot and go after it
      const newDisplaced: Displacement[] = [
        getNotAnimatedDisplacement(preset.inHome4),
      ];
      const expected: DragImpact = {
        movement: {
          displacedBy: getDisplacedBy(axis, preset.inHome2.displaceBy),
          displaced: newDisplaced,
          map: getDisplacementMap(newDisplaced),
        },
        direction: axis.direction,
        destination: {
          index: preset.inHome3.descriptor.index,
          droppableId: preset.home.descriptor.id,
        },
        merge: null,
      };
      expect(result).toEqual(expected);
    });
  });
});
