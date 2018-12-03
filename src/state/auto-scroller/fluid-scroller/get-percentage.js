// @flow

type Args = {|
  startOfRange: number,
  endOfRange: number,
  current: number,
|};

export default ({ startOfRange, endOfRange, current }: Args): number => {
  if (current <= startOfRange) {
    return 0;
  }

  if (current >= endOfRange) {
    return 1;
  }
  const range: number = endOfRange - startOfRange;
  const currentInRange: number = current - startOfRange;
  const percentage: number = currentInRange / range;
  return percentage;
};
