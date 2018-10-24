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

const enableCombine = (droppable: DroppableDimension): DroppableDimension => ({
  ...droppable,
  isCombineEnabled: true,
});

[vertical, horizontal].forEach((axis: Axis) => {
  const preset = getPreset(axis);
  describe(`on ${axis.direction} axis`, () => {
    describe('in area that would usually displace backwards', () => {
      // inHome1 is combined with a non-displaced inHome2
      const willDisplaceForward: boolean = false;
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome1.displaceBy,
        willDisplaceForward,
      );

      const whenCombined: DragImpact = {
        movement: {
          displaced: [],
          map: {},
          displacedBy,
          willDisplaceForward,
        },
        merge: {
          whenEntered: forward,
          combine: {
            draggableId: preset.inHome2.descriptor.id,
            droppableId: preset.home.descriptor.id,
          },
        },
        direction: preset.home.axis.direction,
        destination: null,
      };

      describe('is moving forwards (will increase displacement)', () => {
        it('should move into the spot of the combined item and push it backwards', () => {
          const impact: ?DragImpact = moveToNextIndex({
            isMovingForward: true,
            isInHomeList: true,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            destination: enableCombine(preset.home),
            insideDestination: preset.inHomeList,
            previousImpact: whenCombined,
          });
          invariant(impact);

          const displaced: Displacement[] = [
            {
              draggableId: preset.inHome2.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
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

      describe('is moving backwards (will decrease displacement)', () => {
        it('should move into the spot behind the combined item and not displace it', () => {
          const impact: ?DragImpact = moveToNextIndex({
            isMovingForward: false,
            isInHomeList: true,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            destination: enableCombine(preset.home),
            insideDestination: preset.inHomeList,
            previousImpact: whenCombined,
          });
          invariant(impact);

          const expected: DragImpact = {
            movement: {
              displaced: [],
              map: {},
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
    describe('in area that would usually displace forwards', () => {});
  });
});
