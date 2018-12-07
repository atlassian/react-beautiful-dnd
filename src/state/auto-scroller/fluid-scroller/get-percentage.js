// @flow
import { warning } from '../../../dev-warning';

type Args = {|
  startOfRange: number,
  endOfRange: number,
  current: number,
|};

export default ({ startOfRange, endOfRange, current }: Args): number => {
  const range: number = endOfRange - startOfRange;

  if (range === 0) {
    warning(`
      Detected distance range of 0 in the fluid auto scroller
      This is unexpected and would cause a divide by 0 issue.
      Not allowing an auto scroll
    `);
    return 0;
  }

  const currentInRange: number = current - startOfRange;
  const percentage: number = currentInRange / range;
  return percentage;
};
