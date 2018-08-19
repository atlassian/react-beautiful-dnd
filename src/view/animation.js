// @flow
import type { Position } from 'css-box-model';
import type { DropReason } from '../types';
import { distance, isEqual } from '../state/position';

type GetDropDurationArgs = {|
  current: Position,
  destination: Position,
  reason: DropReason,
|};

const min: number = 0.33;
const max: number = 0.55;
const range: number = max - min;
const maxAtDistance: number = 1500;
const faster: number = 0.6;

export const getDropDuration = ({
  current,
  destination,
  reason,
}: GetDropDurationArgs): number => {
  if (isEqual(current, destination)) {
    return 0;
  }

  const value: number = distance(current, destination);

  if (value === 0) {
    return min;
  }

  if (value >= maxAtDistance) {
    return max;
  }

  // * range from:
  // 0px = 0.33s
  // 1500px and over = 0.55s
  // * If reason === 'CANCEL' then speeding up the animation by 30%
  // * round to 2 decimal points

  const percentage: number = value / maxAtDistance;
  const duration: number = min + range * percentage;

  const withDuration: number =
    reason === 'CANCEL' ? duration * faster : duration;
  // To two decimal points by converting to string and back
  return Number(withDuration.toFixed(2));
};

const dropCurve: string = `cubic-bezier(.2,1,.1,1)`;

export const css = {
  outOfTheWay: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
  jump: `transform ${min * faster}s ${dropCurve}`,
  isDropping: (duration: number): string =>
    `transform ${duration}s ${dropCurve}`,
};
