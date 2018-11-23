// @flow
import { type PixelThresholds } from './get-pixel-thresholds';
import getSpeedFromDistance from './get-speed-from-distance';
import dampenByDuration from './dampen-by-duration';

type Args = {|
  distanceToEdge: number,
  thresholds: PixelThresholds,
  dragStartTime: number,
  shouldUseTimeDampening: boolean,
|};

const minSpeed: number = 1;
const withMinSpeed = (proposed: number) => Math.max(proposed, minSpeed);

export default ({
  distanceToEdge,
  thresholds,
  dragStartTime,
  shouldUseTimeDampening,
}: Args): number => {
  const proposed: number = getSpeedFromDistance(distanceToEdge, thresholds);

  if (proposed < minSpeed) {
    return 0;
  }

  if (!shouldUseTimeDampening) {
    return proposed;
  }

  return withMinSpeed(dampenByDuration(proposed, dragStartTime));
};
