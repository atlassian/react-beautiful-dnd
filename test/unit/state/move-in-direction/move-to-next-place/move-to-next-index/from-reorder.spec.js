// @flow
import invariant from 'tiny-invariant';
import type {
  Axis,
  DragImpact,
  Displacement,
  DisplacedBy,
} from '../../../../../../src/types';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import getHomeImpact from '../../../../../../src/state/get-home-impact';
import { getPreset } from '../../../../../utils/dimension';
import moveToNextIndex from '../../../../../../src/state/move-in-direction/move-to-next-place/move-to-next-index';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';

[vertical, horizontal].forEach((axis: Axis) => {
  const preset = getPreset(axis);
  describe(`on ${axis.direction} axis`, () => {
    // it was cleaner for these scenarios to be batched together into a clean flow
    // rather than recreating the impacts for each test

    describe('in home list', () => {
      it('should update the impact when moving before the start', () => {
        // dragging inHome2 forward away from the start
        const willDisplaceForward: boolean = false;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome2.displaceBy,
          willDisplaceForward,
        );

        const first: ?DragImpact = moveToNextIndex({
          isMovingForward: true,
          isInHomeList: true,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: getHomeImpact(preset.inHome2, preset.home),
        });
        invariant(first);
        {
          const displaced: Displacement[] = [
            {
              draggableId: preset.inHome3.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              willDisplaceForward,
              displacedBy,
            },
            direction: axis.direction,
            merge: null,
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome3.descriptor.index,
            },
          };
          expect(first).toEqual(expected);
        }

        const second: ?DragImpact = moveToNextIndex({
          isMovingForward: true,
          isInHomeList: true,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: first,
        });
        invariant(second);
        {
          // ordered by closest displaced
          const displaced: Displacement[] = [
            {
              draggableId: preset.inHome4.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: preset.inHome3.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              willDisplaceForward,
              displacedBy,
            },
            direction: axis.direction,
            merge: null,
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome4.descriptor.index,
            },
          };
          expect(second).toEqual(expected);
        }

        // Now moving inHome2 backwards towards start

        const third: ?DragImpact = moveToNextIndex({
          isMovingForward: false,
          isInHomeList: true,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: second,
        });
        invariant(third);
        {
          // ordered by closest displaced
          const displaced: Displacement[] = [
            {
              draggableId: preset.inHome3.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              willDisplaceForward,
              displacedBy,
            },
            direction: axis.direction,
            merge: null,
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome3.descriptor.index,
            },
          };
          expect(third).toEqual(expected);
        }

        const fourth: ?DragImpact = moveToNextIndex({
          isMovingForward: false,
          isInHomeList: true,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: third,
        });
        invariant(fourth);
        {
          const expected: DragImpact = {
            movement: {
              displaced: [],
              map: {},
              willDisplaceForward,
              displacedBy,
            },
            direction: axis.direction,
            merge: null,
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome2.descriptor.index,
            },
          };
          expect(fourth).toEqual(expected);
        }
      });

      it('should update the impact when moving after the start', () => {
        // dragging inHome3 backwards away from the start
        const willDisplaceForward: boolean = true;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome3.displaceBy,
          willDisplaceForward,
        );

        // move backwards
        const first: ?DragImpact = moveToNextIndex({
          isMovingForward: false,
          isInHomeList: true,
          draggable: preset.inHome3,
          draggables: preset.draggables,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: getHomeImpact(preset.inHome3, preset.home),
        });
        invariant(first);
        {
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
              willDisplaceForward,
              displacedBy,
            },
            direction: axis.direction,
            merge: null,
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome2.descriptor.index,
            },
          };
          expect(first).toEqual(expected);
        }

        // move backwards again
        const second: ?DragImpact = moveToNextIndex({
          isMovingForward: false,
          isInHomeList: true,
          draggable: preset.inHome3,
          draggables: preset.draggables,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: first,
        });
        invariant(second);
        {
          // ordered by closest displaced
          const displaced: Displacement[] = [
            {
              draggableId: preset.inHome1.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
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
              willDisplaceForward,
              displacedBy,
            },
            direction: axis.direction,
            merge: null,
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome1.descriptor.index,
            },
          };
          expect(second).toEqual(expected);
        }

        // Now moving inHome3 forwards back towards start

        // move forwards
        const third: ?DragImpact = moveToNextIndex({
          isMovingForward: true,
          isInHomeList: true,
          draggable: preset.inHome3,
          draggables: preset.draggables,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: second,
        });
        invariant(third);
        {
          // ordered by closest displaced
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
              willDisplaceForward,
              displacedBy,
            },
            direction: axis.direction,
            merge: null,
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome2.descriptor.index,
            },
          };
          expect(third).toEqual(expected);
        }

        const fourth: ?DragImpact = moveToNextIndex({
          isMovingForward: true,
          isInHomeList: true,
          draggable: preset.inHome3,
          draggables: preset.draggables,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: third,
        });
        invariant(fourth);
        {
          const expected: DragImpact = {
            movement: {
              displaced: [],
              map: {},
              // these values get reset to the default
              // they do not impact the movement as there is nothing displaced
              willDisplaceForward: false,
              displacedBy: getDisplacedBy(
                axis,
                preset.inHome3.displaceBy,
                false,
              ),
            },
            direction: axis.direction,
            merge: null,
            destination: {
              droppableId: preset.home.descriptor.id,
              index: preset.inHome3.descriptor.index,
            },
          };
          expect(fourth).toEqual(expected);
        }
      });

      it('should not allow movement before the start of the list', () => {
        // dragging inHome1 backwards
        const impact: ?DragImpact = moveToNextIndex({
          isMovingForward: false,
          isInHomeList: true,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: getHomeImpact(preset.inHome1, preset.home),
        });

        expect(impact).toBe(null);
      });

      it('should not allow movement after the end of the list', () => {
        // dragging inHome4 forwards
        const impact: ?DragImpact = moveToNextIndex({
          isMovingForward: true,
          isInHomeList: true,
          draggable: preset.inHome3,
          draggables: preset.draggables,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: getHomeImpact(preset.inHome4, preset.home),
        });

        expect(impact).toBe(null);
      });
    });

    describe('in foreign list', () => {
      it('should update the impact when moving after where we started in the foreign start', () => {
        // inHome1 has made its way into index #2 of foreign after a cross axis move

        // always displace forward in a foreign list
        const willDisplaceForward: boolean = true;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome1.displaceBy,
          willDisplaceForward,
        );
        const initial: Displacement[] = [
          {
            draggableId: preset.inForeign2.descriptor.id,
            isVisible: true,
            shouldAnimate: true,
          },
          {
            draggableId: preset.inForeign3.descriptor.id,
            isVisible: true,
            shouldAnimate: true,
          },
          {
            draggableId: preset.inForeign4.descriptor.id,
            isVisible: true,
            shouldAnimate: true,
          },
        ];
        const crossAxisMove: DragImpact = {
          movement: {
            displaced: initial,
            map: getDisplacementMap(initial),
            willDisplaceForward,
            displacedBy,
          },
          direction: axis.direction,
          merge: null,
          destination: {
            droppableId: preset.foreign.descriptor.id,
            index: preset.inForeign2.descriptor.index,
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
        });
        invariant(first);
        {
          const displaced: Displacement[] = [
            {
              draggableId: preset.inForeign3.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: preset.inForeign4.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              willDisplaceForward,
              displacedBy,
            },
            direction: axis.direction,
            merge: null,
            destination: {
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign3.descriptor.index,
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
        });
        invariant(second);
        {
          const displaced: Displacement[] = [
            {
              draggableId: preset.inForeign4.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              willDisplaceForward,
              displacedBy,
            },
            direction: axis.direction,
            merge: null,
            destination: {
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign4.descriptor.index,
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
        });
        invariant(third);
        {
          const displaced: Displacement[] = [
            {
              draggableId: preset.inForeign3.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: preset.inForeign4.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              willDisplaceForward,
              displacedBy,
            },
            direction: axis.direction,
            merge: null,
            destination: {
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign3.descriptor.index,
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
        });
        invariant(fourth);
        {
          // ordered by closest
          const displaced: Displacement[] = [
            {
              draggableId: preset.inForeign2.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: preset.inForeign3.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: preset.inForeign4.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              willDisplaceForward,
              displacedBy,
            },
            direction: axis.direction,
            merge: null,
            destination: {
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign2.descriptor.index,
            },
          };
          expect(fourth).toEqual(expected);
          // also now back where we started
          expect(fourth).toEqual(crossAxisMove);
        }
      });

      it('should update the impact when moving before where we started in the foreign list', () => {
        // inHome1 has made its way into index #3 of foreign after a cross axis move

        // always displace forward in a foreign list
        const willDisplaceForward: boolean = true;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome1.displaceBy,
          willDisplaceForward,
        );
        const initial: Displacement[] = [
          {
            draggableId: preset.inForeign3.descriptor.id,
            isVisible: true,
            shouldAnimate: true,
          },
          {
            draggableId: preset.inForeign4.descriptor.id,
            isVisible: true,
            shouldAnimate: true,
          },
        ];
        const crossAxisMove: DragImpact = {
          movement: {
            displaced: initial,
            map: getDisplacementMap(initial),
            willDisplaceForward,
            displacedBy,
          },
          direction: axis.direction,
          merge: null,
          destination: {
            droppableId: preset.foreign.descriptor.id,
            index: preset.inForeign3.descriptor.index,
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
        });
        invariant(first);
        {
          const displaced: Displacement[] = [
            {
              draggableId: preset.inForeign2.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: preset.inForeign3.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: preset.inForeign4.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              willDisplaceForward,
              displacedBy,
            },
            direction: axis.direction,
            merge: null,
            destination: {
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign2.descriptor.index,
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
        });
        invariant(second);
        {
          const displaced: Displacement[] = [
            {
              draggableId: preset.inForeign1.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: preset.inForeign2.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: preset.inForeign3.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: preset.inForeign4.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              willDisplaceForward,
              displacedBy,
            },
            direction: axis.direction,
            merge: null,
            destination: {
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign1.descriptor.index,
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
        });
        invariant(third);
        {
          // ordered by closest impacted
          const displaced: Displacement[] = [
            {
              draggableId: preset.inForeign2.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: preset.inForeign3.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: preset.inForeign4.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              willDisplaceForward,
              displacedBy,
            },
            direction: axis.direction,
            merge: null,
            destination: {
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign2.descriptor.index,
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
        });
        invariant(fourth);
        {
          // ordered by closest
          const displaced: Displacement[] = [
            {
              draggableId: preset.inForeign3.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: preset.inForeign4.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
          ];
          const expected: DragImpact = {
            movement: {
              displaced,
              map: getDisplacementMap(displaced),
              willDisplaceForward,
              displacedBy,
            },
            direction: axis.direction,
            merge: null,
            destination: {
              droppableId: preset.foreign.descriptor.id,
              index: preset.inForeign3.descriptor.index,
            },
          };
          expect(fourth).toEqual(expected);
          // also now back where we started
          expect(fourth).toEqual(crossAxisMove);
        }
      });

      it('should not allow movement before the start of the list', () => {
        // cross axis move inHome1 before inForeign1
        const willDisplaceForward: boolean = true;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome1.displaceBy,
          willDisplaceForward,
        );
        const initial: Displacement[] = [
          {
            draggableId: preset.inForeign1.descriptor.id,
            isVisible: true,
            shouldAnimate: true,
          },
          {
            draggableId: preset.inForeign2.descriptor.id,
            isVisible: true,
            shouldAnimate: true,
          },
          {
            draggableId: preset.inForeign3.descriptor.id,
            isVisible: true,
            shouldAnimate: true,
          },
          {
            draggableId: preset.inForeign4.descriptor.id,
            isVisible: true,
            shouldAnimate: true,
          },
        ];
        const crossAxisMove: DragImpact = {
          movement: {
            displaced: initial,
            map: getDisplacementMap(initial),
            willDisplaceForward,
            displacedBy,
          },
          direction: axis.direction,
          merge: null,
          destination: {
            droppableId: preset.foreign.descriptor.id,
            index: preset.inForeign1.descriptor.index,
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
        });

        expect(impact).toBe(null);
      });

      it('should allow movement into a spot after the last item in a list', () => {
        // cross axis move inHome4 before inForeign4
        const willDisplaceForward: boolean = true;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome4.displaceBy,
          willDisplaceForward,
        );
        const initial: Displacement[] = [
          {
            draggableId: preset.inForeign4.descriptor.id,
            isVisible: true,
            shouldAnimate: true,
          },
        ];
        const crossAxisMove: DragImpact = {
          movement: {
            // nothing is displaced at this point
            displaced: initial,
            map: getDisplacementMap(initial),
            willDisplaceForward,
            displacedBy,
          },
          direction: axis.direction,
          merge: null,
          // trying to move after spot after inForeign4
          destination: {
            droppableId: preset.foreign.descriptor.id,
            index: preset.inForeign4.descriptor.index,
          },
        };

        // move forwards into spot after inForeign4

        const impact: ?DragImpact = moveToNextIndex({
          isMovingForward: true,
          isInHomeList: false,
          draggable: preset.inHome4,
          draggables: preset.draggables,
          destination: preset.foreign,
          insideDestination: preset.inForeignList,
          previousImpact: crossAxisMove,
        });
        invariant(impact);
        const expected: DragImpact = {
          movement: {
            // nothing is displaced at this point
            displaced: [],
            map: {},
            willDisplaceForward,
            displacedBy,
          },
          direction: axis.direction,
          merge: null,
          // trying to move after spot after inForeign4
          destination: {
            droppableId: preset.foreign.descriptor.id,
            index: preset.inForeign4.descriptor.index + 1,
          },
        };
        expect(impact).toEqual(expected);
      });

      it('should not allow movement after it is already after the last item in a list', () => {
        // cross axis move inHome4 after inForeign4
        const willDisplaceForward: boolean = true;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome4.displaceBy,
          willDisplaceForward,
        );
        const crossAxisMove: DragImpact = {
          movement: {
            // nothing is displaced at this point
            displaced: [],
            map: {},
            willDisplaceForward,
            displacedBy,
          },
          direction: axis.direction,
          merge: null,
          // trying to move after spot after inForeign4
          destination: {
            droppableId: preset.foreign.descriptor.id,
            index: preset.inForeign4.descriptor.index + 1,
          },
        };

        // cannot move forwards outside of list

        const impact: ?DragImpact = moveToNextIndex({
          isMovingForward: true,
          isInHomeList: false,
          draggable: preset.inHome4,
          draggables: preset.draggables,
          destination: preset.foreign,
          insideDestination: preset.inForeignList,
          previousImpact: crossAxisMove,
        });

        expect(impact).toBe(null);
      });
    });
  });
});
