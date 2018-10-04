// @flow
import { offset, type Position, type BoxModel } from 'css-box-model';
import type {
  Viewport,
  Axis,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  DisplacedBy,
  Displacement,
} from '../../../../../../src/types';
import moveToNewDroppable from '../../../../../../src/state/move-in-direction/move-cross-axis/move-to-new-droppable';
import type { Result } from '../../../../../../src/state/move-in-direction/move-cross-axis/move-cross-axis-types';
import scrollDroppable from '../../../../../../src/state/droppable/scroll-droppable';
import {
  goBefore,
  goAfter,
} from '../../../../../../src/state/move-relative-to';
import { add, negate, patch } from '../../../../../../src/state/position';
import { horizontal, vertical } from '../../../../../../src/state/axis';
import {
  getPreset,
  makeScrollable,
  getDraggableDimension,
  getDroppableDimension,
} from '../../../../../utils/dimension';
import noImpact, { noMovement } from '../../../../../../src/state/no-impact';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import { toDraggableMap } from '../../../../../../src/state/dimension-structures';

const dontCare: Position = { x: 0, y: 0 };

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    it('should not to anything if there is not target (can happen if invisibile)', () => {
      expect(
        moveToNewDroppable({
          pageBorderBoxCenter: dontCare,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          moveRelativeTo: null,
          previousImpact: noImpact,
          viewport,
        }),
      ).toBe(null);
    });

    describe('moving back into original index', () => {
      describe('without droppable scroll', () => {
        // the second draggable is moving back into its preset.home
        const result: ?Result = moveToNewDroppable({
          pageBorderBoxCenter: dontCare,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          moveRelativeTo: preset.inHome2,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: noImpact,
          viewport,
        });

        if (!result) {
          throw new Error('invalid test setup');
        }

        it('should return the original center without margin', () => {
          expect(result.pageBorderBoxCenter).toBe(
            preset.inHome2.page.borderBox.center,
          );
        });

        it('should return an empty impact with the original location', () => {
          const expected: DragImpact = {
            movement: noMovement,
            direction: axis.direction,
            destination: {
              droppableId: preset.home.descriptor.id,
              index: 1,
            },
            merge: null,
          };

          expect(result.impact).toEqual(expected);
        });
      });

      describe('with droppable scroll', () => {
        const scrollable: DroppableDimension = makeScrollable(preset.home, 10);
        const scroll: Position = patch(axis.line, 10);
        const displacement: Position = negate(scroll);
        const scrolled: DroppableDimension = scrollDroppable(
          scrollable,
          patch(axis.line, 10),
        );

        const result: ?Result = moveToNewDroppable({
          pageBorderBoxCenter: dontCare,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          moveRelativeTo: preset.inHome2,
          destination: scrolled,
          insideDestination: preset.inHomeList,
          previousImpact: noImpact,
          viewport,
        });

        if (!result) {
          throw new Error('Invalid result');
        }

        it('should account for changes in droppable scroll', () => {
          const expected: Position = add(
            preset.inHome2.page.borderBox.center,
            displacement,
          );

          expect(result.pageBorderBoxCenter).toEqual(expected);
        });

        it('should return an empty impact with the original location', () => {
          const expected: DragImpact = {
            movement: noMovement,
            direction: axis.direction,
            destination: {
              droppableId: preset.home.descriptor.id,
              index: 1,
            },
            merge: null,
          };

          expect(result.impact).toEqual(expected);
        });
      });
    });

    describe('moving before the original index', () => {
      // moving preset.inHome4 into the preset.inHome2 position
      const willDisplaceForward: boolean = true;
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome4.displaceBy,
        willDisplaceForward,
      );

      describe('without droppable scroll', () => {
        const result: ?Result = moveToNewDroppable({
          pageBorderBoxCenter: dontCare,
          draggable: preset.inHome4,
          draggables: preset.draggables,
          moveRelativeTo: preset.inHome2,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: noImpact,
          viewport,
        });

        if (!result) {
          throw new Error('invalid test setup');
        }

        it('should go before the displaced target', () => {
          const displaced: BoxModel = offset(
            preset.inHome2.page,
            displacedBy.point,
          );

          const expected: Position = goBefore({
            axis,
            moveRelativeTo: displaced,
            isMoving: preset.inHome4.page,
          });
          expect(result.pageBorderBoxCenter).toEqual(expected);
        });

        it('should move the everything from the target index to the original index forward', () => {
          const displaced: Displacement[] = [
            {
              draggableId: preset.inHome2.descriptor.id,
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
              // ordered by closest impacted
              displaced,
              map: getDisplacementMap(displaced),
              displacedBy,
              willDisplaceForward,
            },
            direction: axis.direction,
            destination: {
              droppableId: preset.home.descriptor.id,
              // original index of target
              index: 1,
            },
            merge: null,
          };

          expect(result.impact).toEqual(expected);
        });
      });

      describe('with droppable scroll', () => {
        const scrollable: DroppableDimension = makeScrollable(preset.home, 10);
        const scroll: Position = patch(axis.line, 10);
        const displacement: Position = negate(scroll);
        const scrolled: DroppableDimension = scrollDroppable(
          scrollable,
          patch(axis.line, 10),
        );

        const result: ?Result = moveToNewDroppable({
          pageBorderBoxCenter: dontCare,
          draggable: preset.inHome4,
          draggables: preset.draggables,
          moveRelativeTo: preset.inHome2,
          destination: scrolled,
          insideDestination: preset.inHomeList,
          previousImpact: noImpact,
          viewport,
        });

        if (!result) {
          throw new Error('Invalid result');
        }

        it('should should move before the displaced target and account for changes in droppable scroll', () => {
          const displaced: BoxModel = offset(
            preset.inHome2.page,
            displacedBy.point,
          );
          const before: Position = goBefore({
            axis,
            moveRelativeTo: displaced,
            isMoving: preset.inHome4.page,
          });
          const withScroll: Position = add(before, displacement);

          expect(result.pageBorderBoxCenter).toEqual(withScroll);
        });
      });
    });

    describe('moving after the original index', () => {
      // moving inHome1 into the preset.inHome4 position
      // displace backwards when in front of home
      const willDisplaceForward: boolean = false;
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome1.displaceBy,
        willDisplaceForward,
      );
      describe('without droppable scroll', () => {
        const result: ?Result = moveToNewDroppable({
          pageBorderBoxCenter: dontCare,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          moveRelativeTo: preset.inHome4,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: noImpact,
          viewport,
        });

        if (!result) {
          throw new Error('invalid test setup');
        }

        it('should move after the displaced target', () => {
          const displaced: BoxModel = offset(
            preset.inHome4.page,
            displacedBy.point,
          );

          const expected: Position = goAfter({
            axis,
            moveRelativeTo: displaced,
            isMoving: preset.inHome1.page,
          });
          expect(result.pageBorderBoxCenter).toEqual(expected);
        });

        it('should move the everything from the target index to the original index forward', () => {
          // ordered by closest impacted
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
            {
              draggableId: preset.inHome2.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
          ];
          const expected: DragImpact = {
            movement: {
              // ordered by closest impacted
              displaced,
              map: getDisplacementMap(displaced),
              displacedBy,
              willDisplaceForward,
            },
            direction: axis.direction,
            destination: {
              droppableId: preset.home.descriptor.id,
              // original index of target
              index: 3,
            },
            merge: null,
          };

          expect(result.impact).toEqual(expected);
        });
      });

      describe('with droppable scroll', () => {
        const scrollable: DroppableDimension = makeScrollable(preset.home, 10);
        const scroll: Position = patch(axis.line, 10);
        const displacement: Position = negate(scroll);
        const scrolled: DroppableDimension = scrollDroppable(
          scrollable,
          patch(axis.line, 10),
        );

        const result: ?Result = moveToNewDroppable({
          pageBorderBoxCenter: dontCare,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          moveRelativeTo: preset.inHome4,
          destination: scrolled,
          insideDestination: preset.inHomeList,
          previousImpact: noImpact,
          viewport,
        });

        if (!result) {
          throw new Error('Invalid result');
        }

        it('should account for changes in droppable scroll', () => {
          const displaced: BoxModel = offset(
            preset.inHome4.page,
            displacedBy.point,
          );
          const after: Position = goAfter({
            axis,
            moveRelativeTo: displaced,
            isMoving: preset.inHome1.page,
          });
          const withScroll: Position = add(after, displacement);

          expect(result.pageBorderBoxCenter).toEqual(withScroll);
        });
      });
    });

    describe('visibility and displacement', () => {
      it('should indicate when displacement is not visible when not partially visible in the droppable frame', () => {
        const droppable: DroppableDimension = getDroppableDimension({
          descriptor: {
            id: 'with-frame',
            type: 'TYPE',
          },
          direction: axis.direction,
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            [axis.start]: 0,
            // will be cut by frame
            [axis.end]: 200,
          },
          closest: {
            borderBox: {
              [axis.crossAxisStart]: 0,
              [axis.crossAxisEnd]: 100,
              [axis.start]: 0,
              // will cut the subject
              [axis.end]: 100,
            },
            scrollSize: {
              scrollWidth: 200,
              scrollHeight: 200,
            },
            scroll: { x: 0, y: 0 },
            shouldClipSubject: true,
          },
        });
        const inside: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'inside',
            droppableId: droppable.descriptor.id,
            type: droppable.descriptor.type,
            index: 0,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            [axis.start]: 0,
            [axis.end]: 80,
          },
        });
        const outside: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'outside',
            droppableId: droppable.descriptor.id,
            type: droppable.descriptor.type,
            index: 1,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            // outside of the frame
            [axis.start]: 110,
            [axis.end]: 120,
          },
        });
        const customDraggables: DraggableDimension[] = [inside, outside];
        // moving outside back into list with closest being 'outside'
        const displaced: Displacement[] = [
          {
            draggableId: outside.descriptor.id,
            isVisible: false,
            shouldAnimate: false,
          },
        ];
        // displace backwards when moving forward past start
        const willDisplaceForward: boolean = false;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          inside.displaceBy,
          willDisplaceForward,
        );
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            willDisplaceForward,
            displacedBy,
          },
          direction: axis.direction,
          // moving into the outside position
          destination: {
            droppableId: droppable.descriptor.id,
            index: outside.descriptor.index,
          },
          merge: null,
        };

        const result: ?Result = moveToNewDroppable({
          pageBorderBoxCenter: dontCare,
          draggable: inside,
          draggables: toDraggableMap(customDraggables),
          moveRelativeTo: outside,
          destination: droppable,
          insideDestination: customDraggables,
          previousImpact: noImpact,
          viewport,
        });

        if (!result || !result.impact) {
          throw new Error('invalid result');
        }

        expect(result.impact).toEqual(expected);
      });

      it('should indicate when displacement is not visible when not partially visible in the viewport', () => {
        const droppable: DroppableDimension = getDroppableDimension({
          descriptor: {
            id: 'with-frame',
            type: 'TYPE',
          },
          direction: axis.direction,
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            [axis.start]: 0,
            // extends beyond the viewport
            [axis.end]: viewport.frame[axis.end] + 100,
          },
        });
        const inside: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'inside',
            droppableId: droppable.descriptor.id,
            type: droppable.descriptor.type,
            index: 0,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            [axis.start]: 0,
            [axis.end]: viewport.frame[axis.end],
          },
        });
        const outside: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'outside',
            droppableId: droppable.descriptor.id,
            type: droppable.descriptor.type,
            index: 1,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            // outside of the viewport but inside the droppable
            [axis.start]: viewport.frame[axis.end] + 1,
            [axis.end]: viewport.frame[axis.end] + 10,
          },
        });
        const customDraggables: DraggableDimension[] = [inside, outside];
        // Goal: moving inside back into list with closest being 'outside'
        // displace backwards when moving forward past start
        const willDisplaceForward: boolean = false;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          inside.displaceBy,
          willDisplaceForward,
        );
        const displaced: Displacement[] = [
          {
            draggableId: outside.descriptor.id,
            isVisible: false,
            shouldAnimate: false,
          },
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
            willDisplaceForward,
          },
          direction: axis.direction,
          // moving into the outside position
          destination: {
            droppableId: droppable.descriptor.id,
            index: outside.descriptor.index,
          },
          merge: null,
        };

        const result: ?Result = moveToNewDroppable({
          pageBorderBoxCenter: dontCare,
          draggable: inside,
          draggables: toDraggableMap(customDraggables),
          moveRelativeTo: outside,
          destination: droppable,
          insideDestination: customDraggables,
          previousImpact: noImpact,
          viewport,
        });

        if (!result || !result.impact) {
          throw new Error('invalid result');
        }

        expect(result.impact).toEqual(expected);
      });
    });
  });
});
