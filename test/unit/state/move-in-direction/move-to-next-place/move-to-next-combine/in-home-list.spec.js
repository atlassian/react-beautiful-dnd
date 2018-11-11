// @flow
import invariant from 'tiny-invariant';
import type {
  Axis,
  DragImpact,
  Displacement,
  DisplacedBy,
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
import getVisibleDisplacement from '../../../../../utils/get-visible-displacement';

const enableCombine = (droppable: DroppableDimension): DroppableDimension => ({
  ...droppable,
  isCombineEnabled: true,
});

[vertical, horizontal].forEach((axis: Axis) => {
  const preset = getPreset(axis);
  describe(`on ${axis.direction} axis`, () => {
    describe('is moving forward', () => {
      it('should move onto a non-displaced item', () => {
        // inHome1 moved past inHome2 and inHome3, now moving onto inHome4
        const willDisplaceForward: boolean = false;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome1.displaceBy,
          willDisplaceForward,
        );
        const initial: Displacement[] = [
          getVisibleDisplacement(preset.inHome3),
          getVisibleDisplacement(preset.inHome2),
        ];
        const current: DragImpact = {
          movement: {
            displaced: initial,
            map: getDisplacementMap(initial),
            displacedBy,
            willDisplaceForward,
          },
          direction: preset.home.axis.direction,
          merge: null,
          destination: {
            index: preset.inHome3.descriptor.index,
            droppableId: preset.home.descriptor.id,
          },
        };

        const result: ?DragImpact = moveToNextCombine({
          isMovingForward: true,
          isInHomeList: true,
          draggable: preset.inHome1,
          destination: enableCombine(preset.home),
          insideDestination: preset.inHomeList,
          previousImpact: current,
        });
        invariant(result);

        const expected: DragImpact = {
          ...current,
          destination: null,
          merge: {
            whenEntered: forward,
            combine: {
              draggableId: preset.inHome4.descriptor.id,
              droppableId: preset.home.descriptor.id,
            },
          },
        };
        expect(result).toEqual(expected);
      });

      it('should move onto a displaced item', () => {
        // inHome4 moved backwards past inHome3 and inHome2,
        // now moving forward onto inHome2
        const willDisplaceForward: boolean = true;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome4.displaceBy,
          willDisplaceForward,
        );
        const initial: Displacement[] = [
          getVisibleDisplacement(preset.inHome2),
          getVisibleDisplacement(preset.inHome3),
        ];
        const current: DragImpact = {
          movement: {
            displaced: initial,
            map: getDisplacementMap(initial),
            displacedBy,
            willDisplaceForward,
          },
          direction: preset.home.axis.direction,
          merge: null,
          destination: {
            index: preset.inHome2.descriptor.index,
            droppableId: preset.home.descriptor.id,
          },
        };

        const result: ?DragImpact = moveToNextCombine({
          isMovingForward: true,
          isInHomeList: true,
          draggable: preset.inHome4,
          destination: enableCombine(preset.home),
          insideDestination: preset.inHomeList,
          previousImpact: current,
        });
        invariant(result);

        const expected: DragImpact = {
          ...current,
          destination: null,
          merge: {
            whenEntered: forward,
            combine: {
              draggableId: preset.inHome2.descriptor.id,
              droppableId: preset.home.descriptor.id,
            },
          },
        };
        expect(result).toEqual(expected);
      });
    });

    describe('is moving backwards', () => {
      it('should move onto a displaced item', () => {
        // inHome1 moved forwards past inHome2 and inHome3,
        // now moving backwards onto inHome3

        // forwards from start so will displace backwards
        const willDisplaceForward: boolean = false;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome1.displaceBy,
          willDisplaceForward,
        );
        // ordered by closest impacted
        const initial: Displacement[] = [
          getVisibleDisplacement(preset.inHome3),
          getVisibleDisplacement(preset.inHome2),
        ];
        const current: DragImpact = {
          movement: {
            displaced: initial,
            map: getDisplacementMap(initial),
            displacedBy,
            willDisplaceForward,
          },
          direction: preset.home.axis.direction,
          merge: null,
          destination: {
            index: preset.inHome3.descriptor.index,
            droppableId: preset.home.descriptor.id,
          },
        };

        const result: ?DragImpact = moveToNextCombine({
          isMovingForward: false,
          isInHomeList: true,
          draggable: preset.inHome1,
          destination: enableCombine(preset.home),
          insideDestination: preset.inHomeList,
          previousImpact: current,
        });
        invariant(result);

        // no change to displacement
        const expected: DragImpact = {
          ...current,
          destination: null,
          merge: {
            whenEntered: backward,
            combine: {
              draggableId: preset.inHome3.descriptor.id,
              droppableId: preset.home.descriptor.id,
            },
          },
        };
        expect(result).toEqual(expected);
      });

      it('should move onto a non-displaced item', () => {
        // inHome4 moved backwards past inHome3 and inHome1,
        // now moving backwards onto inHome1
        const willDisplaceForward: boolean = true;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome4.displaceBy,
          willDisplaceForward,
        );
        const initial: Displacement[] = [
          getVisibleDisplacement(preset.inHome2),
          getVisibleDisplacement(preset.inHome3),
        ];
        const current: DragImpact = {
          movement: {
            displaced: initial,
            map: getDisplacementMap(initial),
            displacedBy,
            willDisplaceForward,
          },
          direction: preset.home.axis.direction,
          merge: null,
          destination: {
            index: preset.inHome2.descriptor.index,
            droppableId: preset.home.descriptor.id,
          },
        };

        const result: ?DragImpact = moveToNextCombine({
          isMovingForward: false,
          isInHomeList: true,
          draggable: preset.inHome4,
          destination: enableCombine(preset.home),
          insideDestination: preset.inHomeList,
          previousImpact: current,
        });
        invariant(result);

        const expected: DragImpact = {
          ...current,
          destination: null,
          merge: {
            whenEntered: backward,
            combine: {
              draggableId: preset.inHome1.descriptor.id,
              droppableId: preset.home.descriptor.id,
            },
          },
        };
        expect(result).toEqual(expected);
      });
    });
  });
});
