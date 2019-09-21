// @flow
import invariant from 'tiny-invariant';
import type {
  Axis,
  DragImpact,
  DisplacedBy,
} from '../../../../../../../src/types';
import { vertical, horizontal } from '../../../../../../../src/state/axis';
import { getPreset } from '../../../../../../util/dimension';
import moveToNextIndex from '../../../../../../../src/state/move-in-direction/move-to-next-place/move-to-next-index';
import getDisplacedBy from '../../../../../../../src/state/get-displaced-by';
import getLiftEffect from '../../../../../../../src/state/get-lift-effect';
import { getForcedDisplacement } from '../../../../../../util/impact';
import { emptyGroups } from '../../../../../../../src/state/no-impact';

[vertical, horizontal].forEach((axis: Axis) => {
  const preset = getPreset(axis);
  describe(`on ${axis.direction} axis`, () => {
    it('should update the impact when moving with items that started displaced', () => {
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome2.displaceBy,
      );
      const { afterCritical, impact: homeImpact } = getLiftEffect({
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
        afterCritical,
        viewport: preset.viewport,
      });
      invariant(forwardsPastInHome3);
      {
        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [{ dimension: preset.inHome4, shouldAnimate: false }],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              index: preset.inHome3.descriptor.index,
              droppableId: preset.home.descriptor.id,
            },
          },
        };
        expect(forwardsPastInHome3).toEqual(expected);
      }
      const forwardsPastInHome4: ?DragImpact = moveToNextIndex({
        viewport: preset.viewport,
        isMovingForward: true,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: forwardsPastInHome3,
        afterCritical,
      });
      invariant(forwardsPastInHome4);
      {
        const expected: DragImpact = {
          displaced: emptyGroups,
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              index: preset.inHome4.descriptor.index,
              droppableId: preset.home.descriptor.id,
            },
          },
        };
        expect(forwardsPastInHome4).toEqual(expected);
      }

      const backwardsPastInHome4: ?DragImpact = moveToNextIndex({
        viewport: preset.viewport,
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: forwardsPastInHome4,
        afterCritical,
      });
      invariant(backwardsPastInHome4);
      {
        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [{ dimension: preset.inHome4 }],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              index: preset.inHome3.descriptor.index,
              droppableId: preset.home.descriptor.id,
            },
          },
        };
        expect(backwardsPastInHome4).toEqual(expected);
      }

      const backwardsToHome: ?DragImpact = moveToNextIndex({
        viewport: preset.viewport,
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: backwardsPastInHome4,
        afterCritical,
      });
      invariant(backwardsToHome);
      {
        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [
              { dimension: preset.inHome3 },
              { dimension: preset.inHome4 },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              index: preset.inHome2.descriptor.index,
              droppableId: preset.home.descriptor.id,
            },
          },
        };
        expect(backwardsToHome).toEqual(expected);
      }

      const backwardsPastHome: ?DragImpact = moveToNextIndex({
        viewport: preset.viewport,
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome2,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: backwardsToHome,
        afterCritical,
      });
      invariant(backwardsToHome);
      {
        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [
              { dimension: preset.inHome1 },
              { dimension: preset.inHome3 },
              { dimension: preset.inHome4 },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              index: preset.inHome1.descriptor.index,
              droppableId: preset.home.descriptor.id,
            },
          },
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
      const { afterCritical, impact: homeImpact } = getLiftEffect({
        draggable: preset.inHome3,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });

      const backwardsPastInHome2: ?DragImpact = moveToNextIndex({
        viewport: preset.viewport,
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome3,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: homeImpact,
        afterCritical,
      });
      invariant(backwardsPastInHome2);
      {
        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [
              { dimension: preset.inHome2, shouldAnimate: true },
              // initial displacement not animated
              { dimension: preset.inHome4, shouldAnimate: false },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome2.descriptor.index,
            },
          },
        };
        expect(backwardsPastInHome2).toEqual(expected);
      }

      // move backwards again
      const backwardsPastInHome1: ?DragImpact = moveToNextIndex({
        viewport: preset.viewport,
        isMovingForward: false,
        isInHomeList: true,
        draggable: preset.inHome3,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: backwardsPastInHome2,
        afterCritical,
      });
      invariant(backwardsPastInHome1);
      {
        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            // ordered by closest displaced
            visible: [
              {
                dimension: preset.inHome1,
                shouldAnimate: true,
              },
              {
                dimension: preset.inHome2,
                shouldAnimate: true,
              },
              {
                // initial displacement not animated
                dimension: preset.inHome4,
                shouldAnimate: false,
              },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome1.descriptor.index,
            },
          },
        };
        expect(backwardsPastInHome1).toEqual(expected);
      }

      // move forwards
      const forwardsPastInHome1: ?DragImpact = moveToNextIndex({
        viewport: preset.viewport,
        isMovingForward: true,
        isInHomeList: true,
        draggable: preset.inHome3,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: backwardsPastInHome1,
        afterCritical,
      });
      invariant(forwardsPastInHome1);
      {
        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [
              {
                dimension: preset.inHome2,
                shouldAnimate: true,
              },
              {
                // initial displacement not animated
                dimension: preset.inHome4,
                shouldAnimate: false,
              },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome2.descriptor.index,
            },
          },
        };
        expect(forwardsPastInHome1).toEqual(expected);
      }

      const forwardsToHome: ?DragImpact = moveToNextIndex({
        viewport: preset.viewport,
        isMovingForward: true,
        isInHomeList: true,
        draggable: preset.inHome3,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: forwardsPastInHome1,
        afterCritical,
      });
      invariant(forwardsToHome);
      {
        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [{ dimension: preset.inHome4, shouldAnimate: false }],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome3.descriptor.index,
            },
          },
        };
        expect(forwardsToHome).toEqual(expected);
      }
      const forwardsPastHome: ?DragImpact = moveToNextIndex({
        viewport: preset.viewport,
        isMovingForward: true,
        isInHomeList: true,
        draggable: preset.inHome3,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inHomeList,
        previousImpact: forwardsToHome,
        afterCritical,
      });
      invariant(forwardsPastHome);
      {
        const expected: DragImpact = {
          displaced: emptyGroups,
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome4.descriptor.index,
            },
          },
        };
        expect(forwardsPastHome).toEqual(expected);
      }
    });
  });
});
