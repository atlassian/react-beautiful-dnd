// @flow
import type { Position } from 'css-box-model';
import { distance as getDistance } from '../../position';
import { timings } from '../../../animation';
import type { DropReason } from '../../../types';

type GetDropDurationArgs = {|
  current: Position,
  destination: Position,
  reason: DropReason,
|};

const { minDropTime, maxDropTime } = timings;
const dropTimeRange: number = maxDropTime - minDropTime;
const maxDropTimeAtDistance: number = 1500;
// will bring a time lower - which makes it faster
const cancelDropModifier: number = 0.6;

export default ({
  current,
  destination,
  reason,
}: GetDropDurationArgs): number => {
  const distance: number = getDistance(current, destination);
  // even if there is no distance to travel, we might still need to animate opacity
  if (distance <= 0) {
    return minDropTime;
  }

  if (distance >= maxDropTimeAtDistance) {
    return maxDropTime;
  }

  // * range from:
  // 0px = 0.33s
  // 1500px and over = 0.55s
  // * If reason === 'CANCEL' then speeding up the animation
  // * round to 2 decimal points

  const percentage: number = distance / maxDropTimeAtDistance;
  const duration: number = minDropTime + dropTimeRange * percentage;

  const withDuration: number =
    reason === 'CANCEL' ? duration * cancelDropModifier : duration;
  // To two decimal points by converting to string and back
  return Number(withDuration.toFixed(2));
};
