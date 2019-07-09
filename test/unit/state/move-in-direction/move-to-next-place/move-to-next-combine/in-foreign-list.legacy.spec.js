// @flow
import invariant from 'tiny-invariant';
import type {
  Axis,
  DragImpact,
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
import { getForcedDisplacement } from '../../../../../utils/impact';
import { emptyGroups } from '../../../../../../src/state/no-impact';

const enableCombine = (droppable: DroppableDimension): DroppableDimension => ({
  ...droppable,
  isCombineEnabled: true,
});

[vertical, horizontal].forEach((axis: Axis) => {
  const preset = getPreset(axis);

  // always displace forward in foreign list
  const displacedBy: DisplacedBy = getDisplacedBy(
    axis,
    preset.inHome1.displaceBy,
  );

  describe(`on ${axis.direction} axis`, () => {
    it('should move onto a displaced item when moving forwards', () => {
      // inHome1 cross axis moved after inForeign1,
      // now moving forward onto inForeign2
      const current: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [
            { dimension: preset.inForeign2 },
            { dimension: preset.inForeign3 },
            { dimension: preset.inForeign4 },
          ],
        }),
        displacedBy,
        at: {
          type: 'REORDER',
          destination: {
            index: preset.inForeign2.descriptor.index,
            droppableId: preset.foreign.descriptor.id,
          },
        },
      };

      const result: ?DragImpact = moveToNextCombine({
        isMovingForward: true,
        draggable: preset.inHome1,
        destination: enableCombine(preset.foreign),
        insideDestination: preset.inForeignList,
        previousImpact: current,
      });
      invariant(result);

      const expected: DragImpact = {
        ...current,
        at: {
          type: 'COMBINE',
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
      const current: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [
            { dimension: preset.inForeign3 },
            { dimension: preset.inForeign4 },
          ],
        }),
        displacedBy,
        at: {
          type: 'REORDER',
          destination: {
            index: preset.inForeign3.descriptor.index,
            droppableId: preset.foreign.descriptor.id,
          },
        },
      };

      const result: ?DragImpact = moveToNextCombine({
        isMovingForward: false,
        draggable: preset.inHome1,
        destination: enableCombine(preset.foreign),
        insideDestination: preset.inForeignList,
        previousImpact: current,
      });
      invariant(result);

      // no change to displacement
      const expected: DragImpact = {
        ...current,
        at: {
          type: 'COMBINE',
          whenEntered: backward,
          combine: {
            draggableId: preset.inForeign2.descriptor.id,
            droppableId: preset.foreign.descriptor.id,
          },
        },
      };
      expect(result).toEqual(expected);
    });

    it('should not allow combining with anything before the first item', () => {
      const current: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [
            { dimension: preset.inForeign1 },
            { dimension: preset.inForeign2 },
            { dimension: preset.inForeign3 },
            { dimension: preset.inForeign4 },
          ],
        }),
        displacedBy,
        at: {
          type: 'REORDER',
          // in first position
          destination: {
            index: preset.inForeign1.descriptor.index,
            droppableId: preset.foreign.descriptor.id,
          },
        },
      };

      const result: ?DragImpact = moveToNextCombine({
        isMovingForward: false,
        draggable: preset.inHome1,
        destination: enableCombine(preset.foreign),
        insideDestination: preset.inForeignList,
        previousImpact: current,
      });

      expect(result).toEqual(null);
    });

    it('should not allow combining with anything after the last item', () => {
      // in last position
      const current: DragImpact = {
        displaced: emptyGroups,
        displacedBy,
        at: {
          type: 'REORDER',
          // in last position
          destination: {
            index: preset.inForeign4.descriptor.index + 1,
            droppableId: preset.foreign.descriptor.id,
          },
        },
      };

      const result: ?DragImpact = moveToNextCombine({
        isMovingForward: true,
        draggable: preset.inHome1,
        destination: enableCombine(preset.foreign),
        insideDestination: preset.inForeignList,
        previousImpact: current,
      });

      expect(result).toEqual(null);
    });
  });
});
