// @flow

// is a value between two other values

export default (
  lowerBound: number,
  upperBound: number,
): ((number) => boolean) => (value: number): boolean =>
  lowerBound <= value && value <= upperBound;
