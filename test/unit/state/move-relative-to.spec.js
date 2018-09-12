// @flow
import {
  createBox,
  type BoxModel,
  type Spacing,
  type Position,
} from 'css-box-model';
import type { Axis } from '../../../src/types';
import {
  goBefore,
  goAfter,
  goIntoStart,
} from '../../../src/state/move-relative-to';
import { vertical, horizontal } from '../../../src/state/axis';
import { patch } from '../../../src/state/position';

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

[(vertical, horizontal)].forEach((axis: Axis) => {
  it('should align before the target', () => {
    const newCenter: Position = goBefore({
      axis,
      moveRelativeTo,
      isMoving,
    });

    const expected: Position = patch(
      axis.line,
      moveRelativeTo.marginBox[axis.start] -
        (isMoving.margin[axis.end] +
          isMoving.border[axis.end] +
          isMoving.padding[axis.end] +
          isMoving.contentBox[axis.size] / 2),
      moveRelativeTo.borderBox.center[axis.crossAxisLine],
    );

    expect(newCenter).toEqual(expected);
  });

  it('should align after the target', () => {
    const newCenter: Position = goAfter({
      axis,
      moveRelativeTo,
      isMoving,
    });

    const expected: Position = patch(
      axis.line,
      moveRelativeTo.marginBox[axis.end] +
        isMoving.margin[axis.start] +
        isMoving.border[axis.start] +
        isMoving.padding[axis.start] +
        isMoving.contentBox[axis.size] / 2,
      moveRelativeTo.borderBox.center[axis.crossAxisLine],
    );

    expect(newCenter).toEqual(expected);
  });

  it('should move into the start of the context box of the target', () => {
    const newCenter: Position = goIntoStart({
      axis,
      moveInto: moveRelativeTo,
      isMoving,
    });

    const expected: Position = patch(
      axis.line,
      moveRelativeTo.contentBox[axis.start] +
        isMoving.margin[axis.start] +
        isMoving.border[axis.start] +
        isMoving.padding[axis.start] +
        isMoving.contentBox[axis.size] / 2,
      moveRelativeTo.contentBox.center[axis.crossAxisLine],
    );

    expect(newCenter).toEqual(expected);
  });
});
