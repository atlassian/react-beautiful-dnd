// @flow
import invariant from 'tiny-invariant';
import type {
  Axis,
  DragImpact,
  Displacement,
  DroppableDimension,
} from '../../../../../../src/types';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import {
  forward,
  backward,
} from '../../../../../../src/state/user-direction/user-direction-preset';
import { getPreset } from '../../../../../utils/dimension';
import moveToNextCombine from '../../../../../../src/state/move-in-direction/move-to-next-place/move-to-next-combine/index';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import getVisibleDisplacement from '../../../../../utils/get-displacement/get-visible-displacement';
import getNotAnimatedDisplacement from '../../../../../utils/get-displacement/get-not-animated-displacement';
import getHomeOnLift from '../../../../../../src/state/get-home-on-lift';

const enableCombine = (droppable: DroppableDimension): DroppableDimension => ({
  ...droppable,
  isCombineEnabled: true,
});

[vertical, horizontal].forEach((axis: Axis) => {
  const preset = getPreset(axis);
  describe(`on ${axis.direction} axis`, () => {
    it('should move onto an item that started displaced', () => {
      const { impact: homeImpact } = getHomeOnLift({
        draggable: preset.inHome2,
        draggables: preset.draggables,
        home: preset.home,
        viewport: preset.viewport,
      });

      const result: ?DragImpact = moveToNextCombine({
        isMovingForward: true,
        isInHomeList: true,
        draggable: preset.inHome2,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: homeImpact,
      });
      invariant(result);

      const expected: DragImpact = {
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
      expect(result).toEqual(expected);
    });

    it('should move onto an item that started displaced - but now is not', () => {
      // inHome2 moved forward past inHome3 and now moving back onto inHome3

      const displaced: Displacement[] = [
        // inHome3 no longer displaced
        getNotAnimatedDisplacement(preset.inHome4),
      ];
      const pastInHome3: DragImpact = {
        movement: {
          displacedBy: getDisplacedBy(axis, preset.inHome2.displaceBy),
          displaced,
          map: getDisplacementMap(displaced),
        },
        direction: axis.direction,
        destination: {
          index: preset.inHome3.descriptor.index,
          droppableId: preset.home.descriptor.id,
        },
        merge: null,
      };

      const moveBackwardsOntoInHome3: ?DragImpact = moveToNextCombine({
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome2,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: pastInHome3,
      });
      invariant(moveBackwardsOntoInHome3);

      const expected: DragImpact = {
        ...pastInHome3,
        destination: null,
        merge: {
          whenEntered: backward,
          combine: {
            draggableId: preset.inHome3.descriptor.id,
            droppableId: preset.home.descriptor.id,
          },
        },
      };
      expect(moveBackwardsOntoInHome3).toEqual(expected);
    });

    it('should move onto an item that did not start displaced', () => {
      // moving inHome3 backwards onto inHome2
      const { impact: homeImpact } = getHomeOnLift({
        draggable: preset.inHome3,
        draggables: preset.draggables,
        home: preset.home,
        viewport: preset.viewport,
      });

      const result: ?DragImpact = moveToNextCombine({
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome3,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: homeImpact,
      });
      invariant(result);

      const expected: DragImpact = {
        ...homeImpact,
        destination: null,
        merge: {
          whenEntered: backward,
          combine: {
            draggableId: preset.inHome2.descriptor.id,
            droppableId: preset.home.descriptor.id,
          },
        },
      };
      expect(result).toEqual(expected);
    });

    it('should move onto an item that did not start displaced but now is', () => {
      // inHome3 moved backward before inHome2 and now moving back onto inHome2

      const displaced: Displacement[] = [
        // displacement added
        getVisibleDisplacement(preset.inHome2),
        // originally displaced
        getNotAnimatedDisplacement(preset.inHome4),
      ];
      const beforeInHome2: DragImpact = {
        movement: {
          displacedBy: getDisplacedBy(axis, preset.inHome3.displaceBy),
          displaced,
          map: getDisplacementMap(displaced),
        },
        direction: axis.direction,
        destination: {
          index: preset.inHome2.descriptor.index,
          droppableId: preset.home.descriptor.id,
        },
        merge: null,
      };

      const moveForwardsOntoInHome2: ?DragImpact = moveToNextCombine({
        isMovingForward: true,
        isInHomeList: true,
        draggable: preset.inHome3,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: beforeInHome2,
      });
      invariant(moveForwardsOntoInHome2);

      const expected: DragImpact = {
        ...beforeInHome2,
        destination: null,
        merge: {
          whenEntered: forward,
          combine: {
            draggableId: preset.inHome2.descriptor.id,
            droppableId: preset.home.descriptor.id,
          },
        },
      };
      expect(moveForwardsOntoInHome2).toEqual(expected);
    });

    it('should not allow combining with anything before the first item', () => {
      const { impact: homeImpact } = getHomeOnLift({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });

      const result: ?DragImpact = moveToNextCombine({
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome1,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: homeImpact,
      });

      expect(result).toBe(null);
    });

    it('should not allow combining with anything after the last item', () => {
      const { impact: homeImpact } = getHomeOnLift({
        draggable: preset.inHome4,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });

      const result: ?DragImpact = moveToNextCombine({
        isMovingForward: true,
        isInHomeList: true,
        draggable: preset.inHome1,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: homeImpact,
      });

      expect(result).toBe(null);
    });
  });
});
