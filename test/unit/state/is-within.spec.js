// @flow
import isWithin from '../../../src/state/is-within';

describe('is within', () => {
  const lowerBound: number = 5;
  const upperBound: number = 10;
  const execute = isWithin(5, 10);

  it('should return true when the value is between the bounds', () => {
    expect(execute(lowerBound + 1)).toBe(true);
  });

  it('should return true when the value is equal to the lower bound', () => {
    expect(execute(lowerBound)).toBe(true);
  });

  it('should return true when the value is equal to the upper bound', () => {
    expect(execute(upperBound)).toBe(true);
  });

  it('should return false when the value is less then the lower bound', () => {
    expect(execute(lowerBound - 1)).toBe(false);
  });

  it('should return false when the value is greater than the upper bound', () => {
    expect(execute(upperBound + 1)).toBe(false);
  });
});
