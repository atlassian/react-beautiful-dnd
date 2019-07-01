// @flow
import invariant from 'tiny-invariant';
import type {
  Axis,
  DragImpact,
  Displacement,
  DisplacedBy,
} from '../../../../../../../src/types';
import { vertical, horizontal } from '../../../../../../../src/state/axis';
import { getPreset } from '../../../../../../utils/dimension';
import moveToNextIndex from '../../../../../../../src/state/move-in-direction/move-to-next-place/move-to-next-index';
import getDisplacedBy from '../../../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../../../src/state/get-displacement-map';
import getLiftEffect from '../../../../../../../src/state/get-lift-effect';
import getNotAnimatedDisplacement from '../../../../../../utils/get-displacement/get-not-animated-displacement';
import getVisibleDisplacement from '../../../../../../utils/get-displacement/get-visible-displacement';

[vertical, horizontal].forEach((axis: Axis) => {
  const preset = getPreset(axis);
  describe(`on ${axis.direction} axis`, () => {
    it('should update the impact when moving with items that started displaced', () => {
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome2.displaceBy,
      );
      const { onLift, impact: homeImpact } = getHomeOnLift({
        draggable: preset.inHome2,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });

      const forwardsPastInHome3: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: homeImpact,
        onLift,
      });
      invariant(forwardsPastInHome3);
      {
        const displaced: Displacement[] = [
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            displacedBy,
            displaced,
            map: getDisplacementMap(displaced),
          },
          destination: {
            index: preset.inHome3.descriptor.index,
            droppableId: preset.home.descriptor.id,
          },
          merge: null,
        };
        expect(forwardsPastInHome3).toEqual(expected);
      }
      const forwardsPastInHome4: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: forwardsPastInHome3,
        onLift,
      });
      invariant(forwardsPastInHome4);
      {
        const expected: DragImpact = {
          movement: {
            displacedBy,
            displaced: [],
            map: {},
          },
          destination: {
            index: preset.inHome4.descriptor.index,
            droppableId: preset.home.descriptor.id,
          },
          merge: null,
        };
        expect(forwardsPastInHome4).toEqual(expected);
      }

      const backwardsPastInHome4: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: forwardsPastInHome4,
        onLift,
      });
      invariant(backwardsPastInHome4);
      {
        const displaced: Displacement[] = [
          // now animated displacement
          getVisibleDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            displacedBy,
            displaced,
            map: getDisplacementMap(displaced),
          },
          destination: {
            index: preset.inHome3.descriptor.index,
            droppableId: preset.home.descriptor.id,
          },
          merge: null,
        };
        expect(backwardsPastInHome4).toEqual(expected);
      }

      const backwardsToHome: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: backwardsPastInHome4,
        onLift,
      });
      invariant(backwardsToHome);
      {
        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inHome3),
          getVisibleDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            displacedBy,
            displaced,
            map: getDisplacementMap(displaced),
          },
          destination: {
            index: preset.inHome2.descriptor.index,
            droppableId: preset.home.descriptor.id,
          },
          merge: null,
        };
        expect(backwardsToHome).toEqual(expected);
      }

      const backwardsPastHome: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: backwardsToHome,
        onLift,
      });
      invariant(backwardsToHome);
      {
        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inHome1),
          getVisibleDisplacement(preset.inHome3),
          getVisibleDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            displacedBy,
            displaced,
            map: getDisplacementMap(displaced),
          },
          destination: {
            index: preset.inHome1.descriptor.index,
            droppableId: preset.home.descriptor.id,
          },
          merge: null,
        };
        expect(backwardsPastHome).toEqual(expected);
      }
    });

    it('should update the impact when moving with items that did not start displaced', () => {
      // dragging inHome3 backwards away from the start
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome3.displaceBy,
      );
      const { onLift, impact: homeImpact } = getHomeOnLift({
        draggable: preset.inHome3,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });

      const backwardsPastInHome2: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome3,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: homeImpact,
        onLift,
      });
      invariant(backwardsPastInHome2);
      {
        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inHome2),
          // initial displacement not animated
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          merge: null,
          destination: {
            droppableId: preset.home.descriptor.id,
            index: preset.inHome2.descriptor.index,
          },
        };
        expect(backwardsPastInHome2).toEqual(expected);
      }

      // move backwards again
      const backwardsPastInHome1: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome3,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: backwardsPastInHome2,
        onLift,
      });
      invariant(backwardsPastInHome1);
      {
        // ordered by closest displaced
        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inHome1),
          getVisibleDisplacement(preset.inHome2),
          // initial displacement not animated
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          merge: null,
          destination: {
            droppableId: preset.home.descriptor.id,
            index: preset.inHome1.descriptor.index,
          },
        };
        expect(backwardsPastInHome1).toEqual(expected);
      }

      // move forwards
      const forwardsPastInHome1: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: true,
        draggable: preset.inHome3,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: backwardsPastInHome1,
        onLift,
      });
      invariant(forwardsPastInHome1);
      {
        // ordered by closest displaced
        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inHome2),
          // initial displacement not animated
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          merge: null,
          destination: {
            droppableId: preset.home.descriptor.id,
            index: preset.inHome2.descriptor.index,
          },
        };
        expect(forwardsPastInHome1).toEqual(expected);
      }

      const forwardsToHome: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: true,
        draggable: preset.inHome3,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: forwardsPastInHome1,
        onLift,
      });
      invariant(forwardsToHome);
      {
        const displaced: Displacement[] = [
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          merge: null,
          destination: {
            droppableId: preset.home.descriptor.id,
            index: preset.inHome3.descriptor.index,
          },
        };
        expect(forwardsToHome).toEqual(expected);
      }
      const forwardsPastHome: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: true,
        draggable: preset.inHome3,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: forwardsToHome,
        onLift,
      });
      invariant(forwardsPastHome);
      {
        const displaced: Displacement[] = [];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          merge: null,
          destination: {
            droppableId: preset.home.descriptor.id,
            index: preset.inHome4.descriptor.index,
          },
        };
        expect(forwardsPastHome).toEqual(expected);
      }
    });
  });
});
