// @flow
import { type Position } from 'css-box-model';
import getDragImpact from '../../../../src/state/get-drag-impact';
import noImpact from '../../../../src/state/no-impact';
import { add, patch, subtract } from '../../../../src/state/position';
import { vertical, horizontal } from '../../../../src/state/axis';
import { scrollDroppable } from '../../../../src/state/droppable-dimension';
import {
  getPreset,
  disableDroppable,
  makeScrollable,
  getDroppableDimension,
  getDraggableDimension,
} from '../../../utils/dimension';
import getViewport from '../../../../src/view/window/get-viewport';
import type {
  Axis,
  DraggableDimension,
  DroppableDimension,
  DroppableDimensionMap,
  DragImpact,
  DraggableDimensionMap,
  Viewport,
} from '../../../../src/types';

const viewport: Viewport = getViewport();

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const {
      home,
      inHome1,
      inHome2,
      inHome3,
      inHome4,
      droppables,
      draggables,
    } = getPreset(axis);

    it('should return no impact when not dragging over anything', () => {
      // dragging up above the list
      const farAway: Position = {
        x: 1000,
        y: 1000,
      };

      const impact: DragImpact = getDragImpact({
        pageBorderBoxCenter: farAway,
        draggable: inHome1,
        draggables,
        droppables,
        previousImpact: noImpact,
        viewport,
      });

      expect(impact).toEqual(noImpact);
    });

    it('should return no impact when home is disabled', () => {
      const disabled: DroppableDimension = disableDroppable(home);
      const withDisabled: DroppableDimensionMap = {
        ...droppables,
        [disabled.descriptor.id]: disabled,
      };
      // choosing the center of inHome2 which should have an impact
      const pageBorderBoxCenter: Position = inHome2.page.borderBox.center;

      const impact: DragImpact = getDragImpact({
        pageBorderBoxCenter,
        draggable: inHome1,
        draggables,
        droppables: withDisabled,
        previousImpact: noImpact,
        viewport,
      });

      expect(impact).toEqual(noImpact);
    });

    // moving inHome1 no where
    describe('moving over original position', () => {
      it('should return no impact', () => {
        const pageBorderBoxCenter: Position = inHome1.page.borderBox.center;
        const expected: DragImpact = {
          movement: {
            displaced: [],
            amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
            isBeyondStartPosition: false,
          },
          direction: axis.direction,
          destination: {
            droppableId: home.descriptor.id,
            index: 0,
          },
        };

        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter,
          draggable: inHome1,
          draggables,
          droppables,
          previousImpact: noImpact,
          viewport,
        });

        expect(impact).toEqual(expected);
      });
    });

    // moving inHome1 forward towards but not past inHome2
    describe('have not moved enough to impact others', () => {
      it('should return no impact', () => {
        const pageBorderBoxCenter: Position = patch(
          axis.line,
          // up to the line but not over it
          inHome2.page.borderBox[axis.start],
          // no movement on cross axis
          inHome1.page.borderBox.center[axis.crossAxisLine],
        );
        const expected: DragImpact = {
          movement: {
            amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
            displaced: [],
            isBeyondStartPosition: true,
          },
          direction: axis.direction,
          destination: {
            droppableId: home.descriptor.id,
            index: 0,
          },
        };

        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter,
          draggable: inHome1,
          draggables,
          droppables,
          previousImpact: noImpact,
          viewport,
        });

        expect(impact).toEqual(expected);
      });
    });

    // moving inHome2 forwards past inHome4
    describe('moving beyond start position', () => {
      const pageBorderBoxCenter: Position = patch(
        axis.line,
        inHome4.page.borderBox[axis.start] + 1,
        // no change
        inHome2.page.borderBox.center[axis.crossAxisLine],
      );
      const expected: DragImpact = {
        movement: {
          amount: patch(axis.line, inHome2.page.marginBox[axis.size]),
          // ordered by closest to current location
          displaced: [
            {
              draggableId: inHome4.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: inHome3.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
          ],
          isBeyondStartPosition: true,
        },
        direction: axis.direction,
        destination: {
          droppableId: home.descriptor.id,
          // is now after inHome4
          index: 3,
        },
      };

      const impact: DragImpact = getDragImpact({
        pageBorderBoxCenter,
        draggable: inHome2,
        draggables,
        droppables,
        previousImpact: noImpact,
        viewport,
      });

      expect(impact).toEqual(expected);
    });

    // moving inHome3 back past inHome1
    describe('moving back past start position', () => {
      it('should move into the correct position', () => {
        const pageBorderBoxCenter: Position = patch(
          axis.line,
          inHome1.page.borderBox[axis.end] - 1,
          // no change
          inHome3.page.borderBox.center[axis.crossAxisLine],
        );

        const expected: DragImpact = {
          movement: {
            amount: patch(axis.line, inHome3.page.marginBox[axis.size]),
            // ordered by closest to current location
            displaced: [
              {
                draggableId: inHome1.descriptor.id,
                isVisible: true,
                shouldAnimate: true,
              },
              {
                draggableId: inHome2.descriptor.id,
                isVisible: true,
                shouldAnimate: true,
              },
            ],
            isBeyondStartPosition: false,
          },
          direction: axis.direction,
          destination: {
            droppableId: home.descriptor.id,
            // is now before inHome1
            index: 0,
          },
        };

        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter,
          draggable: inHome3,
          draggables,
          droppables,
          previousImpact: noImpact,
          viewport,
        });

        expect(impact).toEqual(expected);
      });
    });

    describe('home droppable scroll has changed during a drag', () => {
      const scrollableHome: DroppableDimension = makeScrollable(home);
      const withScrollableHome = {
        ...droppables,
        [home.descriptor.id]: scrollableHome,
      };

      // moving inHome1 past inHome2 by scrolling the dimension
      describe('moving beyond start position with own scroll', () => {
        it('should move past other draggables', () => {
          // the middle of the target edge
          const startOfInHome2: Position = patch(
            axis.line,
            inHome2.page.borderBox[axis.start],
            inHome2.page.borderBox.center[axis.crossAxisLine],
          );
          const distanceNeeded: Position = add(
            subtract(startOfInHome2, inHome1.page.borderBox.center),
            // need to move over the edge
            patch(axis.line, 1),
          );
          const scrolledHome: DroppableDimension = scrollDroppable(
            scrollableHome,
            distanceNeeded,
          );
          const updatedDroppables: DroppableDimensionMap = {
            ...withScrollableHome,
            [home.descriptor.id]: scrolledHome,
          };
          // no changes in current page center from original
          const pageBorderBoxCenter: Position = inHome1.page.borderBox.center;
          const expected: DragImpact = {
            movement: {
              amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
              // ordered by closest to current location
              displaced: [
                {
                  draggableId: inHome2.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
              ],
              isBeyondStartPosition: true,
            },
            direction: axis.direction,
            destination: {
              droppableId: home.descriptor.id,
              // is now after inHome2
              index: 1,
            },
          };

          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter,
            draggable: inHome1,
            draggables,
            droppables: updatedDroppables,
            previousImpact: noImpact,
            viewport,
          });

          expect(impact).toEqual(expected);
        });
      });

      // moving inHome4 back past inHome2
      describe('moving back past start position with own scroll', () => {
        it('should move back past inHome2', () => {
          // the middle of the target edge
          const endOfInHome2: Position = patch(
            axis.line,
            inHome2.page.borderBox[axis.end],
            inHome2.page.borderBox.center[axis.crossAxisLine],
          );
          const distanceNeeded: Position = add(
            subtract(endOfInHome2, inHome4.page.borderBox.center),
            // need to move over the edge
            patch(axis.line, -1),
          );
          const scrolledHome: DroppableDimension = scrollDroppable(
            scrollableHome,
            distanceNeeded,
          );
          const updatedDroppables: DroppableDimensionMap = {
            ...withScrollableHome,
            [home.descriptor.id]: scrolledHome,
          };
          // no changes in current page center from original
          const pageBorderBoxCenter: Position = inHome4.page.borderBox.center;
          const expected: DragImpact = {
            movement: {
              amount: patch(axis.line, inHome4.page.marginBox[axis.size]),
              // ordered by closest to current location
              displaced: [
                {
                  draggableId: inHome2.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
                {
                  draggableId: inHome3.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
              ],
              isBeyondStartPosition: false,
            },
            direction: axis.direction,
            destination: {
              droppableId: home.descriptor.id,
              // is now before inHome2
              index: 1,
            },
          };

          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter,
            draggable: inHome4,
            draggables,
            droppables: updatedDroppables,
            previousImpact: noImpact,
            viewport,
          });

          expect(impact).toEqual(expected);
        });
      });
    });

    describe('displacement of invisible items', () => {
      it('should indicate when a displacement is not visible due to being outside of the droppable frame', () => {
        const droppable: DroppableDimension = getDroppableDimension({
          descriptor: {
            id: 'my-custom-droppable',
            type: 'TYPE',
          },
          direction: axis.direction,
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            [axis.start]: 0,
            // will be cut by the frame
            [axis.end]: 200,
          },
          closest: {
            borderBox: {
              [axis.crossAxisStart]: 0,
              [axis.crossAxisEnd]: 100,
              [axis.start]: 0,
              // will cut the subject,
              [axis.end]: 100,
            },
            scrollSize: {
              scrollWidth: 100,
              scrollHeight: 100,
            },
            scroll: { x: 0, y: 0 },
            shouldClipSubject: true,
          },
        });
        const visible: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'visible',
            droppableId: droppable.descriptor.id,
            type: droppable.descriptor.type,
            index: 0,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            [axis.start]: 0,
            [axis.end]: 100,
          },
        });
        const notVisible1: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'not-visible-1',
            droppableId: droppable.descriptor.id,
            type: droppable.descriptor.type,
            index: 1,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            // inside the frame, but not in the visible area
            [axis.start]: 110,
            [axis.end]: 120,
          },
        });
        const notVisible2: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'not-visible-2',
            droppableId: droppable.descriptor.id,
            type: droppable.descriptor.type,
            index: 2,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            // inside the frame, but not in the visible area
            [axis.start]: 130,
            [axis.end]: 140,
          },
        });
        const customDraggables: DraggableDimensionMap = {
          [visible.descriptor.id]: visible,
          [notVisible1.descriptor.id]: notVisible1,
          [notVisible2.descriptor.id]: notVisible2,
        };
        const customDroppables: DroppableDimensionMap = {
          [droppable.descriptor.id]: droppable,
        };
        const expected: DragImpact = {
          movement: {
            // ordered by closest to current position
            displaced: [
              {
                draggableId: visible.descriptor.id,
                isVisible: true,
                shouldAnimate: true,
              },
              {
                draggableId: notVisible1.descriptor.id,
                // showing that the displacement in non-visual
                isVisible: false,
                shouldAnimate: false,
              },
            ],
            amount: patch(axis.line, notVisible2.page.marginBox[axis.size]),
            isBeyondStartPosition: false,
          },
          direction: axis.direction,
          // moved into the first position
          destination: {
            droppableId: droppable.descriptor.id,
            index: 0,
          },
        };

        const impact: DragImpact = getDragImpact({
          // moving backwards to near the start of the droppable
          pageBorderBoxCenter: { x: 1, y: 1 },
          // dragging the notVisible2 draggable backwards
          draggable: notVisible2,
          draggables: customDraggables,
          droppables: customDroppables,
          previousImpact: noImpact,
          viewport,
        });

        expect(impact).toEqual(expected);
      });

      it('should indicate when a displacement is not visible due to being outside of the viewport', () => {
        const droppable: DroppableDimension = getDroppableDimension({
          descriptor: {
            id: 'my-custom-droppable',
            type: 'TYPE',
          },
          direction: axis.direction,
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            [axis.start]: 0,
            [axis.end]: viewport.frame[axis.end] + 100,
          },
        });
        const visible: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'visible',
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
        const notVisible1: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'not-visible-1',
            droppableId: droppable.descriptor.id,
            type: droppable.descriptor.type,
            index: 1,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            // inside the droppable, but not in the visible area
            [axis.start]: viewport.frame[axis.end] + 10,
            [axis.end]: viewport.frame[axis.end] + 20,
          },
        });
        const notVisible2: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'not-visible-2',
            droppableId: droppable.descriptor.id,
            type: droppable.descriptor.type,
            index: 2,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            // inside the droppable, but not in the visible area
            [axis.start]: viewport.frame[axis.end] + 30,
            [axis.end]: viewport.frame[axis.end] + 40,
          },
        });
        const customDraggables: DraggableDimensionMap = {
          [visible.descriptor.id]: visible,
          [notVisible1.descriptor.id]: notVisible1,
          [notVisible2.descriptor.id]: notVisible2,
        };
        const customDroppables: DroppableDimensionMap = {
          [droppable.descriptor.id]: droppable,
        };
        const expected: DragImpact = {
          movement: {
            // ordered by closest to current position
            displaced: [
              {
                draggableId: visible.descriptor.id,
                isVisible: true,
                shouldAnimate: true,
              },
              {
                draggableId: notVisible1.descriptor.id,
                // showing that the displacement in non-visual
                isVisible: false,
                shouldAnimate: false,
              },
            ],
            amount: patch(axis.line, notVisible2.page.marginBox[axis.size]),
            isBeyondStartPosition: false,
          },
          direction: axis.direction,
          // moved into the first position
          destination: {
            droppableId: droppable.descriptor.id,
            index: 0,
          },
        };

        const impact: DragImpact = getDragImpact({
          // moving backwards to near the start of the droppable
          pageBorderBoxCenter: { x: 1, y: 1 },
          // dragging the notVisible2 draggable backwards
          draggable: notVisible2,
          draggables: customDraggables,
          droppables: customDroppables,
          previousImpact: noImpact,
          viewport,
        });

        expect(impact).toEqual(expected);
      });
    });
  });
});
