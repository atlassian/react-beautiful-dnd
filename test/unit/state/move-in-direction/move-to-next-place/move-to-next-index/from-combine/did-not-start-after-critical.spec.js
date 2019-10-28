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
    it('should move forward off combining with is displaced', () => {
      // Setup: inHome1 combining with inForeign1 and then moving forward past it
      // Expected: inHome1 moves after inForeign1 and inForeign1 is no longer displaced
      const { afterCritical } = getLiftEffect({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const combining: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [
            { dimension: preset.inForeign1 },
            { dimension: preset.inForeign2 },
            { dimension: preset.inForeign3 },
            { dimension: preset.inForeign4 },
          ],
        }),
        displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
        at: {
          type: 'COMBINE',
          whenEntered: forward,
          combine: {
            draggableId: preset.inForeign1.descriptor.id,
            droppableId: preset.foreign.descriptor.id,
          },
        },
      };

      const result: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: enableCombine(preset.foreign),
        insideDestination: preset.inForeignList,
        previousImpact: combining,
        afterCritical,
        viewport: preset.viewport,
      });

      const expected: DragImpact = {
        // inForeign1 no longer displaced
        displaced: getForcedDisplacement({
          visible: [
            { dimension: preset.inForeign2 },
            { dimension: preset.inForeign3 },
            { dimension: preset.inForeign4 },
          ],
        }),
        displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
        at: {
          type: 'REORDER',
          destination: {
            index: preset.inForeign2.descriptor.index,
            droppableId: preset.foreign.descriptor.id,
          },
        },
      };
      expect(result).toEqual(expected);
    });

    it('should move backward off combining with is displaced', () => {
      // Setup: inHome1 combining with inForeign1 and then moving backward before it
      // Expected: inHome1 goes before inForeign1 and displacement is not changed
      const { afterCritical } = getLiftEffect({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const combining: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [
            { dimension: preset.inForeign1 },
            { dimension: preset.inForeign2 },
            { dimension: preset.inForeign3 },
            { dimension: preset.inForeign4 },
          ],
        }),
        displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
        at: {
          type: 'COMBINE',
          whenEntered: forward,
          combine: {
            draggableId: preset.inForeign1.descriptor.id,
            droppableId: preset.foreign.descriptor.id,
          },
        },
      };

      const result: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: enableCombine(preset.foreign),
        insideDestination: preset.inForeignList,
        previousImpact: combining,
        afterCritical,
        viewport: preset.viewport,
      });

      const expected: DragImpact = {
        ...combining,
        at: {
          type: 'REORDER',
          destination: {
            index: preset.inForeign1.descriptor.index,
            droppableId: preset.foreign.descriptor.id,
          },
        },
      };
      expect(result).toEqual(expected);
    });

    it('should move forward off combining with a non-displaced item', () => {
      // Setup
      // - inHome1 past inForeign1
      // - inHome1 moves backwards onto inForeign1
      // - inHome1 moves forwards off inForeign1
      // Expected
      // - inHome1 moves before inForeign1
      // - inForeign1 becomes displaced
      const { afterCritical } = getLiftEffect({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const combining: DragImpact = {
        displaced: getForcedDisplacement({
          // inForeign1 is not displaced
          visible: [
            { dimension: preset.inForeign2 },
            { dimension: preset.inForeign3 },
            { dimension: preset.inForeign4 },
          ],
        }),
        displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
        // moved backward onto inForeign1
        at: {
          type: 'COMBINE',
          whenEntered: backward,
          combine: {
            draggableId: preset.inForeign1.descriptor.id,
            droppableId: preset.foreign.descriptor.id,
          },
        },
      };

      const result: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: enableCombine(preset.foreign),
        insideDestination: preset.inForeignList,
        previousImpact: combining,
        afterCritical,
        viewport: preset.viewport,
      });

      const expected: DragImpact = {
        displaced: getForcedDisplacement({
          // inForeign1 still not displaced
          visible: [
            { dimension: preset.inForeign2 },
            { dimension: preset.inForeign3 },
            { dimension: preset.inForeign4 },
          ],
        }),
        displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
        at: {
          type: 'REORDER',
          destination: {
            index: preset.inForeign2.descriptor.index,
            droppableId: preset.foreign.descriptor.id,
          },
        },
      };

      expect(result).toEqual(expected);
    });

    it('should move backward off combining with a non-displaced item', () => {
      // Setup
      // - inHome1 past inForeign1
      // - inHome1 moves backwards onto inForeign1
      // - inHome1 moves backwards off inForeign1
      // Expected
      // - inHome1 moves forward off inForeign1
      // - no displacement changes
      const { afterCritical } = getLiftEffect({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const combining: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [
            // inForeign1 not displaced
            { dimension: preset.inForeign2 },
            { dimension: preset.inForeign3 },
            { dimension: preset.inForeign4 },
          ],
        }),
        displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
        at: {
          // moved backward onto inForeign1
          type: 'COMBINE',
          whenEntered: backward,
          combine: {
            draggableId: preset.inForeign1.descriptor.id,
            droppableId: preset.foreign.descriptor.id,
          },
        },
      };

      const result: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: enableCombine(preset.foreign),
        insideDestination: preset.inForeignList,
        previousImpact: combining,
        afterCritical,
        viewport: preset.viewport,
      });

      const expected: DragImpact = {
        displaced: getForcedDisplacement({
          // inForeign1 now displaced
          visible: [
            { dimension: preset.inForeign1 },
            { dimension: preset.inForeign2 },
            { dimension: preset.inForeign3 },
            { dimension: preset.inForeign4 },
          ],
        }),
        displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
        at: {
          type: 'REORDER',
          destination: {
            index: preset.inForeign1.descriptor.index,
            droppableId: preset.foreign.descriptor.id,
          },
        },
      };
      expect(result).toEqual(expected);
    });
  });
});
