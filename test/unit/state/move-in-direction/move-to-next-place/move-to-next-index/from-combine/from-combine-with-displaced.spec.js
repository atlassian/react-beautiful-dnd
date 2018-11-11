// @flow
import invariant from 'tiny-invariant';
import type {
  Axis,
  DragImpact,
  Displacement,
  DisplacedBy,
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
import getVisibleDisplacement from '../../../../../../utils/get-visible-displacement';

const enableCombine = (droppable: DroppableDimension): DroppableDimension => ({
  ...droppable,
  isCombineEnabled: true,
});

[vertical, horizontal].forEach((axis: Axis) => {
  const preset = getPreset(axis);
  describe(`on ${axis.direction} axis`, () => {
    describe('in area that would usually displace backwards', () => {
      // inHome1 has moved past inHome2 and inHome3 and has moved backwards onto displaced inHome3
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
      const combinedWithInHome3: DragImpact = {
        movement: {
          displaced: initial,
          map: getDisplacementMap(initial),
          displacedBy,
          willDisplaceForward,
        },
        merge: {
          whenEntered: backward,
          combine: {
            draggableId: preset.inHome3.descriptor.id,
            droppableId: preset.home.descriptor.id,
          },
        },
        direction: preset.home.axis.direction,
        destination: null,
      };

      describe('is moving forwards (will increase displacement)', () => {
        it('should move into the spot of the combined item and leave it displaced', () => {
          const impact: ?DragImpact = moveToNextIndex({
            isMovingForward: true,
            isInHomeList: true,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            destination: enableCombine(preset.home),
            insideDestination: preset.inHomeList,
            previousImpact: combinedWithInHome3,
          });
          invariant(impact);

          // ordered by closest
          const displaced: Displacement[] = [
            getVisibleDisplacement(preset.inHome3),
            getVisibleDisplacement(preset.inHome2),
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              displacedBy,
              willDisplaceForward,
            },
            merge: null,
            direction: preset.home.axis.direction,
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome3.descriptor.index,
            },
          };
          expect(impact).toEqual(expected);
        });
      });

      describe('is moving backwards (will decrease displacement)', () => {
        it('should move into the spot behind the combined item and remove its displacement', () => {
          // moving back behind inHome3
          const impact: ?DragImpact = moveToNextIndex({
            isMovingForward: false,
            isInHomeList: true,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            destination: enableCombine(preset.home),
            insideDestination: preset.inHomeList,
            previousImpact: combinedWithInHome3,
          });
          invariant(impact);

          const displaced: Displacement[] = [
            getVisibleDisplacement(preset.inHome2),
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              displacedBy,
              willDisplaceForward,
            },
            merge: null,
            direction: preset.home.axis.direction,
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome2.descriptor.index,
            },
          };
          expect(impact).toEqual(expected);
        });
      });
    });

    describe('in area that would usually displace forwards', () => {
      // inHome3 has moved backwards past inHome2 and inHome1 and has moved forward onto displaced inHome1
      const willDisplaceForward: boolean = true;
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome3.displaceBy,
        willDisplaceForward,
      );

      const initial: Displacement[] = [
        getVisibleDisplacement(preset.inHome1),
        getVisibleDisplacement(preset.inHome2),
      ];
      const combinedWithInHome1: DragImpact = {
        movement: {
          displaced: initial,
          map: getDisplacementMap(initial),
          displacedBy,
          willDisplaceForward,
        },
        merge: {
          whenEntered: forward,
          combine: {
            draggableId: preset.inHome1.descriptor.id,
            droppableId: preset.home.descriptor.id,
          },
        },
        direction: preset.home.axis.direction,
        destination: null,
      };

      describe('is moving forwards (will decrease displacement)', () => {
        it('should move into the visual spot of the combined item and remove its displacement', () => {
          // moving inHome3 forwards off of displaced inHome1
          // inHome1 will no longer be displaced
          const impact: ?DragImpact = moveToNextIndex({
            isMovingForward: true,
            isInHomeList: true,
            draggable: preset.inHome3,
            draggables: preset.draggables,
            destination: enableCombine(preset.home),
            insideDestination: preset.inHomeList,
            previousImpact: combinedWithInHome1,
          });
          invariant(impact);

          // ordered by closest
          const displaced: Displacement[] = [
            getVisibleDisplacement(preset.inHome2),
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              displacedBy,
              willDisplaceForward,
            },
            merge: null,
            direction: preset.home.axis.direction,
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome2.descriptor.index,
            },
          };
          expect(impact).toEqual(expected);
        });
      });

      describe('is moving backwards (will increase displacement)', () => {
        it('should move into the spot of the combined item and push it backwards', () => {
          // moving inHome3 backwards after combining with displaced inHome1
          // will move before inHome1 and leave it displaced
          const impact: ?DragImpact = moveToNextIndex({
            isMovingForward: false,
            isInHomeList: true,
            draggable: preset.inHome3,
            draggables: preset.draggables,
            destination: enableCombine(preset.home),
            insideDestination: preset.inHomeList,
            previousImpact: combinedWithInHome1,
          });
          invariant(impact);

          const displaced: Displacement[] = [
            getVisibleDisplacement(preset.inHome1),
            getVisibleDisplacement(preset.inHome2),
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              displacedBy,
              willDisplaceForward,
            },
            merge: null,
            direction: preset.home.axis.direction,
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome1.descriptor.index,
            },
          };
          expect(impact).toEqual(expected);
        });
      });
    });
  });
});
