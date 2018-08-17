// @flow
import type { Position } from 'css-box-model';
import type { UserDirection } from '../../../../src/types';
import getUserDirection from '../../../../src/state/user-direction/get-user-direction';
import { add, subtract } from '../../../../src/state/position';

const previous: UserDirection = {
  vertical: 'up',
  horizontal: 'right',
};
const original: Position = {
  x: 10,
  y: 20,
};

describe('vertical', () => {
  it('should return the previous direction if there is no change on the vertical axis', () => {
    const current: Position = {
      x: -100,
      y: original.y,
    };

    expect(getUserDirection(previous, original, current).vertical).toEqual(
      previous.vertical,
    );
  });

  it('should return down if the user is moving down', () => {
    const current: Position = add(original, { y: 1, x: 0 });

    expect(getUserDirection(previous, original, current).vertical).toEqual(
      'down',
    );
  });

  it('should return up if the user is moving up', () => {
    const current: Position = subtract(original, { y: 1, x: 0 });

    expect(getUserDirection(previous, original, current).vertical).toEqual(
      'up',
    );
  });
});

describe('horizontal', () => {
  it('should return the previous direction if there is no change on the horizontal axis', () => {
    const current: Position = {
      x: original.x,
      y: -200,
    };

    expect(getUserDirection(previous, original, current).horizontal).toEqual(
      previous.horizontal,
    );
  });

  it('should return right if the user is moving right', () => {
    const current: Position = add(original, { y: 0, x: 1 });

    expect(getUserDirection(previous, original, current).horizontal).toEqual(
      'right',
    );
  });

  it('should return left if the user is moving left', () => {
    const current: Position = subtract(original, { y: 0, x: 1 });

    expect(getUserDirection(previous, original, current).horizontal).toEqual(
      'left',
    );
  });
});
