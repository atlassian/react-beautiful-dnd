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

const withMinSpeed = (proposed: number) => Math.max(proposed, 1);

export default ({
  distanceToEdge,
  thresholds,
  dragStartTime,
  shouldUseTimeDampening,
}: Args): number => {
  const proposed: number = getSpeedFromDistance(distanceToEdge, thresholds);

  if (!shouldUseTimeDampening) {
    return withMinSpeed(proposed);
  }

  return withMinSpeed(dampenByDuration(proposed, dragStartTime));
};
