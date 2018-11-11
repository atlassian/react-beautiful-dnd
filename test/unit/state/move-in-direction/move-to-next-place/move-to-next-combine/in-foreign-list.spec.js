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

  // always displace forward in foreign list
  const willDisplaceForward: boolean = true;
  const displacedBy: DisplacedBy = getDisplacedBy(
    axis,
    preset.inHome1.displaceBy,
    willDisplaceForward,
  );

  describe(`on ${axis.direction} axis`, () => {
    it('should move onto a displaced item when moving forwards', () => {
      // inHome1 cross axis moved after inForeign1,
      // now moving forward onto inForeign2
      const initial: Displacement[] = [
        getVisibleDisplacement(preset.inForeign2),
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const current: DragImpact = {
        movement: {
          displaced: initial,
          map: getDisplacementMap(initial),
          displacedBy,
          willDisplaceForward,
        },
        direction: preset.foreign.axis.direction,
        merge: null,
        destination: {
          index: preset.inForeign2.descriptor.index,
          droppableId: preset.foreign.descriptor.id,
        },
      };

      const result: ?DragImpact = moveToNextCombine({
        isMovingForward: true,
        isInHomeList: false,
        draggable: preset.inHome1,
        destination: enableCombine(preset.foreign),
        insideDestination: preset.inForeignList,
        previousImpact: current,
      });
      invariant(result);

      const expected: DragImpact = {
        ...current,
        destination: null,
        merge: {
          whenEntered: forward,
          combine: {
            draggableId: preset.inForeign2.descriptor.id,
            droppableId: preset.foreign.descriptor.id,
          },
        },
      };
      expect(result).toEqual(expected);
    });

    it('should move onto a non-displaced item when moving backwards', () => {
      // inHome1 in foreign list after inForeign2
      // moving backwards will move it onto the non-displaced inForeign2
      // ordered by closest impacted
      const initial: Displacement[] = [
        getVisibleDisplacement(preset.inForeign3),
        getVisibleDisplacement(preset.inForeign4),
      ];
      const current: DragImpact = {
        movement: {
          displaced: initial,
          map: getDisplacementMap(initial),
          displacedBy,
          willDisplaceForward,
        },
        direction: preset.foreign.axis.direction,
        merge: null,
        destination: {
          index: preset.inForeign3.descriptor.index,
          droppableId: preset.foreign.descriptor.id,
        },
      };

      const result: ?DragImpact = moveToNextCombine({
        isMovingForward: false,
        isInHomeList: false,
        draggable: preset.inHome1,
        destination: enableCombine(preset.foreign),
        insideDestination: preset.inForeignList,
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
            draggableId: preset.inForeign2.descriptor.id,
            droppableId: preset.foreign.descriptor.id,
          },
        },
      };
      expect(result).toEqual(expected);
    });
  });
});
