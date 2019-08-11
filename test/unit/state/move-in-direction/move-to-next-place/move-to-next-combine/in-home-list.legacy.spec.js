// @flow
import invariant from 'tiny-invariant';
import type {
  Axis,
  DragImpact,
  DroppableDimension,
} from '../../../../../../src/types';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import {
  forward,
  backward,
} from '../../../../../../src/state/user-direction/user-direction-preset';
import { getPreset } from '../../../../../util/dimension';
import moveToNextCombine from '../../../../../../src/state/move-in-direction/move-to-next-place/move-to-next-combine/index';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getLiftEffect from '../../../../../../src/state/get-lift-effect';
import { getForcedDisplacement } from '../../../../../util/impact';

const enableCombine = (droppable: DroppableDimension): DroppableDimension => ({
  ...droppable,
  isCombineEnabled: true,
});

[vertical, horizontal].forEach((axis: Axis) => {
  const preset = getPreset(axis);
  describe(`on ${axis.direction} axis`, () => {
    it('should move onto an item that started displaced', () => {
      const { impact: homeImpact } = getLiftEffect({
        draggable: preset.inHome2,
        draggables: preset.draggables,
        home: preset.home,
        viewport: preset.viewport,
      });

      const result: ?DragImpact = moveToNextCombine({
        isMovingForward: true,
        draggable: preset.inHome2,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: homeImpact,
      });
      invariant(result);

      const expected: DragImpact = {
        ...homeImpact,
        at: {
          type: 'COMBINE',
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

      const pastInHome3: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [{ dimension: preset.inHome4, shouldAnimate: false }],
        }),
        displacedBy: getDisplacedBy(axis, preset.inHome2.displaceBy),
        at: {
          type: 'REORDER',
          destination: {
            index: preset.inHome3.descriptor.index,
            droppableId: preset.home.descriptor.id,
          },
        },
      };
      const moveBackwardsOntoInHome3: ?DragImpact = moveToNextCombine({
        isMovingForward: false,
        draggable: preset.inHome2,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: pastInHome3,
      });
      invariant(moveBackwardsOntoInHome3);

      const expected: DragImpact = {
        ...pastInHome3,
        at: {
          type: 'COMBINE',
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
      const { impact: homeImpact } = getLiftEffect({
        draggable: preset.inHome3,
        draggables: preset.draggables,
        home: preset.home,
        viewport: preset.viewport,
      });

      const result: ?DragImpact = moveToNextCombine({
        isMovingForward: false,
        draggable: preset.inHome3,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: homeImpact,
      });
      invariant(result);

      const expected: DragImpact = {
        ...homeImpact,
        at: {
          type: 'COMBINE',
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

      const beforeInHome2: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [
            { dimension: preset.inHome2 },
            // originally displaced
            { dimension: preset.inHome4, shouldAnimate: false },
          ],
        }),
        displacedBy: getDisplacedBy(axis, preset.inHome3.displaceBy),
        at: {
          type: 'REORDER',
          destination: {
            index: preset.inHome2.descriptor.index,
            droppableId: preset.home.descriptor.id,
          },
        },
      };

      const moveForwardsOntoInHome2: ?DragImpact = moveToNextCombine({
        isMovingForward: true,
        draggable: preset.inHome3,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: beforeInHome2,
      });
      invariant(moveForwardsOntoInHome2);

      const expected: DragImpact = {
        ...beforeInHome2,
        at: {
          type: 'COMBINE',
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
      const { impact: homeImpact } = getLiftEffect({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });

      const result: ?DragImpact = moveToNextCombine({
        isMovingForward: false,
        draggable: preset.inHome1,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: homeImpact,
      });

      expect(result).toBe(null);
    });

    it('should not allow combining with anything after the last item', () => {
      const { impact: homeImpact } = getLiftEffect({
        draggable: preset.inHome4,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });

      const result: ?DragImpact = moveToNextCombine({
        isMovingForward: true,
        draggable: preset.inHome1,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: homeImpact,
      });

      expect(result).toBe(null);
    });
  });
});
