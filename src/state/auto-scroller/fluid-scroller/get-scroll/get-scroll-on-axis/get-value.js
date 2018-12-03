// @flow
import { type PixelThresholds } from './get-pixel-thresholds';
import getSpeedFromDistance from './get-value-from-distance';
import dampenSpeedByTime from './dampen-value-by-time';

type Args = {|
  distanceToEdge: number,
  thresholds: PixelThresholds,
  dragStartTime: number,
  shouldUseTimeDampening: boolean,
|};

// A scroll event will not trigger unless you scroll at least 1px
const minSpeed: number = 1;

export default ({
  distanceToEdge,
  thresholds,
  dragStartTime,
  shouldUseTimeDampening,
}: Args): number => {
  const speed: number = getSpeedFromDistance(distanceToEdge, thresholds);

  // not enough distance to trigger a minimum scroll
  // we can bail here
  if (speed < minSpeed) {
    return 0;
  }

  // Dampen an auto scroll speed based on duration of drag

  if (!shouldUseTimeDampening) {
    return speed;
  }

  // Once we know an auto scroll should occur based on distance,
  // we must let at least 1px through to trigger a scroll event an
  // another auto scroll call
  return Math.max(dampenSpeedByTime(speed, dragStartTime), minSpeed);
};
