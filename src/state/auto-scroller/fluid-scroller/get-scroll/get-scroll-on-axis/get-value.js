// @flow
import { type DistanceThresholds } from './get-distance-thresholds';
import getValueFromDistance from './get-value-from-distance';
import dampenValueByTime from './dampen-value-by-time';
import minScroll from './min-scroll';

type Args = {|
  distanceToEdge: number,
  thresholds: DistanceThresholds,
  dragStartTime: number,
  shouldUseTimeDampening: boolean,
|};

export default ({
  distanceToEdge,
  thresholds,
  dragStartTime,
  shouldUseTimeDampening,
}: Args): number => {
  const scroll: number = getValueFromDistance(distanceToEdge, thresholds);

  // not enough distance to trigger a minimum scroll
  // we can bail here
  if (scroll === 0) {
    return 0;
  }

  // Dampen an auto scroll speed based on duration of drag

  if (!shouldUseTimeDampening) {
    return scroll;
  }

  // Once we know an auto scroll should occur based on distance,
  // we must let at least 1px through to trigger a scroll event an
  // another auto scroll call

  return Math.max(dampenValueByTime(scroll, dragStartTime), minScroll);
};
