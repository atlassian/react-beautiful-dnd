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
  const displacedBy: DisplacedBy = getDisplacedBy(
    axis,
    preset.inHome1.displaceBy,
  );
  const { afterCritical } = getLiftEffect({
    draggable: preset.inHome1,
    home: preset.home,
    draggables: preset.draggables,
    viewport: preset.viewport,
  });
  describe(`on ${axis.direction} axis`, () => {
    // it was cleaner for these scenarios to be batched together into a clean flow
    // rather than recreating the impacts for each test

    it('should update the impact when moving after where we started in the foreign start', () => {
      // inHome1 has made its way into index #2 of foreign after a cross axis move

      const crossAxisMove: DragImpact = {
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
            droppableId: preset.foreign.descriptor.id,
            index: preset.inForeign2.descriptor.index,
          },
        },
      };

      // moving forward
      const first: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: preset.foreign,
        insideDestination: preset.inForeignList,
        previousImpact: crossAxisMove,
        afterCritical,
        viewport: preset.viewport,
      });
      invariant(first);
      {
        const expected: DragImpact = {
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
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign3.descriptor.index,
            },
          },
        };
        expect(first).toEqual(expected);
      }

      // moving forward again
      const second: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: preset.foreign,
        insideDestination: preset.inForeignList,
        previousImpact: first,
        afterCritical,
        viewport: preset.viewport,
      });
      invariant(second);
      {
        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            visible: [{ dimension: preset.inForeign4 }],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign4.descriptor.index,
            },
          },
        };
        expect(second).toEqual(expected);
      }

      // now moving backwards towards where we started in the foreign list

      // moving backwards
      const third: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: preset.foreign,
        insideDestination: preset.inForeignList,
        previousImpact: second,
        afterCritical,
        viewport: preset.viewport,
      });
      invariant(third);
      {
        const expected: DragImpact = {
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
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign3.descriptor.index,
            },
          },
        };
        expect(third).toEqual(expected);
      }

      const fourth: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: preset.foreign,
        insideDestination: preset.inForeignList,
        previousImpact: third,
        afterCritical,
        viewport: preset.viewport,
      });
      invariant(fourth);
      {
        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            // ordered by closest
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
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign2.descriptor.index,
            },
          },
        };
        expect(fourth).toEqual(expected);
        // also now back where we started
        expect(fourth).toEqual(crossAxisMove);
      }
    });

    it('should update the impact when moving before where we started in the foreign list', () => {
      // inHome1 has made its way into index #3 of foreign after a cross axis move
      const crossAxisMove: DragImpact = {
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
            droppableId: preset.foreign.descriptor.id,
            index: preset.inForeign3.descriptor.index,
          },
        },
      };

      // moving backwards
      const first: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: preset.foreign,
        insideDestination: preset.inForeignList,
        previousImpact: crossAxisMove,
        afterCritical,
        viewport: preset.viewport,
      });
      invariant(first);
      {
        const expected: DragImpact = {
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
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign2.descriptor.index,
            },
          },
        };
        expect(first).toEqual(expected);
      }

      // moving backwards again
      const second: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: preset.foreign,
        insideDestination: preset.inForeignList,
        previousImpact: first,
        afterCritical,
        viewport: preset.viewport,
      });
      invariant(second);
      {
        const expected: DragImpact = {
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
            destination: {
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign1.descriptor.index,
            },
          },
        };
        expect(second).toEqual(expected);
      }

      // now moving forwards towards where we started in the foreign list

      // moving forwards
      const third: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: preset.foreign,
        insideDestination: preset.inForeignList,
        previousImpact: second,
        afterCritical,
        viewport: preset.viewport,
      });
      invariant(third);
      {
        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            // ordered by closest impacted
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
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign2.descriptor.index,
            },
          },
        };
        expect(third).toEqual(expected);
      }

      // moving forwards again
      const fourth: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: preset.foreign,
        insideDestination: preset.inForeignList,
        previousImpact: third,
        afterCritical,
        viewport: preset.viewport,
      });
      invariant(fourth);
      {
        const expected: DragImpact = {
          displaced: getForcedDisplacement({
            // ordered by closest
            visible: [
              { dimension: preset.inForeign3 },
              { dimension: preset.inForeign4 },
            ],
          }),
          displacedBy,
          at: {
            type: 'REORDER',
            destination: {
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign3.descriptor.index,
            },
          },
        };
        expect(fourth).toEqual(expected);
        // also now back where we started
        expect(fourth).toEqual(crossAxisMove);
      }
    });

    it('should not allow displaced before the start of the list', () => {
      // cross axis move inHome1 before inForeign1
      const crossAxisMove: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [
            { dimension: preset.inForeign1 },
            { dimension: preset.inForeign2 },
            { dimension: preset.inForeign3 },
          ],
        }),
        displacedBy,
        at: {
          type: 'REORDER',
          destination: {
            droppableId: preset.foreign.descriptor.id,
            index: preset.inForeign1.descriptor.index,
          },
        },
      };

      // cannot move backwards

      const impact: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: preset.home,
        insideDestination: preset.inForeignList,
        previousImpact: crossAxisMove,
        afterCritical,
        viewport: preset.viewport,
      });

      expect(impact).toBe(null);
    });

    it('should allow displaced into a spot after the last item in a list', () => {
      // cross axis move inHome1 before inForeign4
      const crossAxisMove: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [{ dimension: preset.inForeign4 }],
        }),
        displacedBy,
        at: {
          type: 'REORDER',
          // currently in the spot that inForeign4 initially occupied
          destination: {
            droppableId: preset.foreign.descriptor.id,
            index: preset.inForeign4.descriptor.index,
          },
        },
      };

      // move forwards into spot after inForeign4

      const impact: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: preset.foreign,
        insideDestination: preset.inForeignList,
        previousImpact: crossAxisMove,
        afterCritical,
        viewport: preset.viewport,
      });
      invariant(impact);
      const expected: DragImpact = {
        // nothing is displaced at this point
        displaced: emptyGroups,
        displacedBy,
        at: {
          type: 'REORDER',
          // trying to move after spot after inForeign4
          destination: {
            droppableId: preset.foreign.descriptor.id,
            index: preset.inForeign4.descriptor.index + 1,
          },
        },
      };
      expect(impact).toEqual(expected);
    });

    const atEndOfForeignList: DragImpact = {
      // nothing is displaced at this point
      displaced: emptyGroups,
      displacedBy,
      at: {
        type: 'REORDER',
        // after inForeign4
        destination: {
          droppableId: preset.foreign.descriptor.id,
          index: preset.inForeign4.descriptor.index + 1,
        },
      },
    };

    it('should not allow displaced after it is already after the last item in a list', () => {
      const impact: ?DragImpact = moveToNextIndex({
        isMovingForward: true,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: preset.foreign,
        insideDestination: preset.inForeignList,
        previousImpact: atEndOfForeignList,
        afterCritical,
        viewport: preset.viewport,
      });

      expect(impact).toBe(null);
    });

    it('should allow displaced back from after the last item in a list', () => {
      const impact: ?DragImpact = moveToNextIndex({
        isMovingForward: false,
        isInHomeList: false,
        draggable: preset.inHome1,
        draggables: preset.draggables,
        destination: preset.foreign,
        insideDestination: preset.inForeignList,
        previousImpact: atEndOfForeignList,
        afterCritical,
        viewport: preset.viewport,
      });

      const expected: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [{ dimension: preset.inForeign4 }],
        }),
        displacedBy,
        at: {
          type: 'REORDER',
          // now in position of inForeign4
          destination: {
            droppableId: preset.foreign.descriptor.id,
            index: preset.inForeign4.descriptor.index,
          },
        },
      };
      expect(impact).toEqual(expected);
    });
  });
});
