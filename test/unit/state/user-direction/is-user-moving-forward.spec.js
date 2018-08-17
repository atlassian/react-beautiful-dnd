// @flow
import type { UserDirection } from '../../../../src/types';
import isUserMovingForward from '../../../../src/state/user-direction/is-user-moving-forward';
import { vertical, horizontal } from '../../../../src/state/axis';

describe('vertical', () => {
  it('should return true if moving down', () => {
    const direction: UserDirection = {
      vertical: 'down',
      horizontal: 'left',
    };
    expect(isUserMovingForward(vertical, direction)).toBe(true);
  });
  it('should return false if moving up', () => {
    const direction: UserDirection = {
      vertical: 'up',
      horizontal: 'right',
    };
    expect(isUserMovingForward(vertical, direction)).toBe(false);
  });
});

describe('horizontal', () => {
  it('should return true if moving right', () => {
    const direction: UserDirection = {
      vertical: 'up',
      horizontal: 'right',
    };
    expect(isUserMovingForward(horizontal, direction)).toBe(true);
  });
  it('should return false if moving left', () => {
    const direction: UserDirection = {
      vertical: 'down',
      horizontal: 'left',
    };
    expect(isUserMovingForward(horizontal, direction)).toBe(false);
  });
});
