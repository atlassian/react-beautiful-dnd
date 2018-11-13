// @flow
import {
  createBox,
  type BoxModel,
  type Spacing,
  type Position,
} from 'css-box-model';
import type { Axis } from '../../../../src/types';
import {
  goBefore,
  goAfter,
  goIntoStart,
} from '../../../../src/state/get-center-from-impact/move-relative-to';
import { vertical, horizontal } from '../../../../src/state/axis';
import { patch } from '../../../../src/state/position';

let spacing: number = 1;

const getAssortedSpacing = (): Spacing => ({
  top: spacing++,
  right: spacing++,
  bottom: spacing++,
  left: spacing++,
});

const moveRelativeTo: BoxModel = createBox({
  borderBox: {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
  },
  margin: getAssortedSpacing(),
  border: getAssortedSpacing(),
  padding: getAssortedSpacing(),
});

const isMoving: BoxModel = createBox({
  borderBox: {
    top: 400,
    left: 400,
    right: 500,
    bottom: 500,
  },
  margin: getAssortedSpacing(),
  border: getAssortedSpacing(),
  padding: getAssortedSpacing(),
});

const distanceFromStartToCenter = (axis: Axis, box: BoxModel): number =>
  box.margin[axis.start] +
  box.border[axis.start] +
  box.padding[axis.start] +
  box.contentBox[axis.size] / 2;

const distanceFromEndToCenter = (axis: Axis, box: BoxModel): number =>
  box.margin[axis.end] +
  box.border[axis.end] +
  box.padding[axis.end] +
  box.contentBox[axis.size] / 2;

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    it('should move into the start of the context box of the target', () => {
      const newCenter: Position = goIntoStart({
        axis,
        moveInto: moveRelativeTo,
        isMoving,
      });

      const expected: Position = patch(
        axis.line,
        // start from the start of the context box of the target
        moveRelativeTo.contentBox[axis.start] +
          // add the distance from the start to the center of the moving item
          distanceFromStartToCenter(axis, isMoving),
        // move on the same cross axis as the list we are moving into
        moveRelativeTo.contentBox.center[axis.crossAxisLine],
      );

      expect(newCenter).toEqual(expected);
    });

    describe('is over home list', () => {
      it('should align before the target', () => {
        const newCenter: Position = goBefore({
          axis,
          moveRelativeTo,
          isMoving,
          isOverHome: true,
        });

        const expected: Position = patch(
          axis.line,
          // start at the start of the item we are moving relative to
          moveRelativeTo.marginBox[axis.start] -
            // add the space from the end of the dragging item to its center
            distanceFromEndToCenter(axis, isMoving),
          // move on the same cross axis as where the item started
          isMoving.borderBox.center[axis.crossAxisLine],
        );

        expect(newCenter).toEqual(expected);
      });

      it('should align after the target', () => {
        const newCenter: Position = goAfter({
          axis,
          moveRelativeTo,
          isMoving,
          isOverHome: true,
        });

        const expected: Position = patch(
          axis.line,
          // start at the end of the margin box
          moveRelativeTo.marginBox[axis.end] +
            // add the distance to the start of the target center
            distanceFromStartToCenter(axis, isMoving),
          // move on the same cross axis as where the item started
          isMoving.borderBox.center[axis.crossAxisLine],
        );

        expect(newCenter).toEqual(expected);
      });
    });

    describe('is over foreign list', () => {
      it('should align before the target', () => {
        const newCenter: Position = goBefore({
          axis,
          moveRelativeTo,
          isMoving,
          isOverHome: false,
        });

        const expected: Position = patch(
          axis.line,
          // start at the start of the target
          moveRelativeTo.marginBox[axis.start] -
            // subtract the space from end of the moving item to its center
            distanceFromEndToCenter(axis, isMoving),
          // move on the cross axis of the target
          moveRelativeTo.borderBox.center[axis.crossAxisLine],
        );

        expect(newCenter).toEqual(expected);
      });

      it('should align after the target', () => {
        const newCenter: Position = goAfter({
          axis,
          moveRelativeTo,
          isMoving,
          isOverHome: false,
        });

        const expected: Position = patch(
          axis.line,
          // start at the end of the target
          moveRelativeTo.marginBox[axis.end] +
            // add the space from the start of the moving item to its center
            distanceFromStartToCenter(axis, isMoving),
          // move on the cross axis of the target
          moveRelativeTo.borderBox.center[axis.crossAxisLine],
        );

        expect(newCenter).toEqual(expected);
      });
    });
  });
});
