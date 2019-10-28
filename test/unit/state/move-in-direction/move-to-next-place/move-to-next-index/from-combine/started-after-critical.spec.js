// @flow
import type {
  Axis,
  DragImpact,
  DroppableDimension,
} from '../../../../../../../src/types';
import { vertical, horizontal } from '../../../../../../../src/state/axis';
import {
  forward,
  backward,
} from '../../../../../../../src/state/user-direction/user-direction-preset';
import { getPreset } from '../../../../../../util/dimension';
import moveToNextIndex from '../../../../../../../src/state/move-in-direction/move-to-next-place/move-to-next-index/index';
import getDisplacedBy from '../../../../../../../src/state/get-displaced-by';
import getLiftEffect from '../../../../../../../src/state/get-lift-effect';
import { getForcedDisplacement } from '../../../../../../util/impact';

const enableCombine = (droppable: DroppableDimension): DroppableDimension => ({
  ...droppable,
  isCombineEnabled: true,
});

[vertical, horizontal].forEach((axis: Axis) => {
  const preset = getPreset(axis);
  describe(`on ${axis.direction} axis`, () => {
    it('should move backward off combining with an item that is displaced', () => {
      // inHome2 combining with inHome3
      const { afterCritical, impact: homeImpact } = getLiftEffect({
        draggable: preset.inHome2,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const combining: DragImpact = {
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

      const result: ?DragImpact = moveToNextIndex({
        viewport: preset.viewport,
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: combining,
        afterCritical,
      });

      expect(result).toEqual(homeImpact);
    });

    it('should move forward past a combining an item that is displaced', () => {
      // inHome2 combining with inHome3
      const { afterCritical, impact: homeImpact } = getLiftEffect({
        draggable: preset.inHome2,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const combining: DragImpact = {
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

      const result: ?DragImpact = moveToNextIndex({
        viewport: preset.viewport,
        isMovingForward: true,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: combining,
        afterCritical,
      });

      const expected: DragImpact = {
        displaced: getForcedDisplacement({
          // inHome3 now displaced
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
      expect(result).toEqual(expected);
    });

    it('should move backwards past combining with an item that started displaced - but now is not', () => {
      // inHome2 moved past inHome3 and then backwards onto it
      const { afterCritical } = getLiftEffect({
        draggable: preset.inHome2,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const combining: DragImpact = {
        displaced: getForcedDisplacement({
          // inHome3 now displaced
          visible: [{ dimension: preset.inHome4, shouldAnimate: false }],
        }),
        displacedBy: getDisplacedBy(axis, preset.inHome2.displaceBy),
        at: {
          type: 'COMBINE',
          whenEntered: backward,
          combine: {
            draggableId: preset.inHome3.descriptor.id,
            droppableId: preset.home.descriptor.id,
          },
        },
      };

      const result: ?DragImpact = moveToNextIndex({
        viewport: preset.viewport,
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: combining,
        afterCritical,
      });

      // backwards movement should displace inHome3
      const expected: DragImpact = {
        displaced: getForcedDisplacement({
          // inHome3 now displaced
          visible: [
            { dimension: preset.inHome3, shouldAnimate: true },
            { dimension: preset.inHome4, shouldAnimate: false },
          ],
        }),
        displacedBy: getDisplacedBy(axis, preset.inHome2.displaceBy),
        at: {
          type: 'REORDER',
          destination: {
            index: preset.inHome2.descriptor.index,
            droppableId: preset.home.descriptor.id,
          },
        },
      };
      expect(result).toEqual(expected);
    });

    it('should move forwards past combining with an item that started displaced - but now is not', () => {
      // inHome2 moved past inHome3 and then backwards onto it
      const { afterCritical } = getLiftEffect({
        draggable: preset.inHome2,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });

      const combining: DragImpact = {
        displaced: getForcedDisplacement({
          // preset.inHome3 is no longer displaced
          visible: [{ dimension: preset.inHome4, shouldAnimate: false }],
        }),
        displacedBy: getDisplacedBy(axis, preset.inHome2.displaceBy),
        at: {
          type: 'COMBINE',
          whenEntered: backward,
          combine: {
            draggableId: preset.inHome3.descriptor.id,
            droppableId: preset.home.descriptor.id,
          },
        },
      };

      const result: ?DragImpact = moveToNextIndex({
        viewport: preset.viewport,
        isMovingForward: true,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: enableCombine(preset.home),
        insideDestination: preset.inHomeList,
        previousImpact: combining,
        afterCritical,
      });

      const expected: DragImpact = {
        // forwards movement off inHome3. It will leave inHome3 in the same spot and go after it
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
      expect(result).toEqual(expected);
    });
  });
});
