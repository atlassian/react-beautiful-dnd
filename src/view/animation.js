// @flow
import type { Position } from 'css-box-model';
import type { DropReason } from '../types';
import { distance as getDistance, isEqual, origin } from '../state/position';

type GetDropDurationArgs = {|
  current: Position,
  destination: Position,
  reason: DropReason,
|};

const minDropTime: number = 0.33;
const maxDropTime: number = 0.55;
const dropTimeRange: number = maxDropTime - minDropTime;
const maxDropTimeAtDistance: number = 1500;
// will bring a time lower - which makes it faster
const cancelDropModifier: number = 0.6;
const outOfTheWayTime: number = 0.2;

export const getDropDuration = ({
  current,
  destination,
  reason,
}: GetDropDurationArgs): number => {
  if (isEqual(current, destination)) {
    return 0;
  }

  const distance: number = getDistance(current, destination);

  if (distance === 0) {
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

export const curves = {
  outOfTheWay: 'cubic-bezier(0.2, 0, 0, 1)',
  drop: 'cubic-bezier(.2,1,.1,1)',
};

const outOfTheWayTiming = `${outOfTheWayTime}s ${curves.outOfTheWay}`;

export const transitions = {
  fluid: `opacity ${outOfTheWayTiming}`,
  jump: `transform ${outOfTheWayTiming}, opacity ${outOfTheWayTiming}`,
  drop: (duration: number): string => {
    const timing: string = `${duration}s ${curves.drop}`;
    return `transform ${timing}, opacity ${timing}`;
  },
  outOfTheWay: `transform ${outOfTheWayTiming}`,
};

const moveTo = (offset: Position): ?string =>
  isEqual(offset, origin) ? null : `translate(${offset.x}px, ${offset.y}px)`;

export const transforms = {
  moveTo,
  drop: (offset: Position, isCombining: boolean) => {
    const translate: ?string = moveTo(offset);
    if (!translate) {
      return null;
    }

    // only transforming the translate
    if (!isCombining) {
      return translate;
    }

    // when dropping while combining we also update the scale
    return `${translate} scale(0.75)`;
  },
};
