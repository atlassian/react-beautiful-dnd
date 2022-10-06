// @flow
import type {
  DistanceThresholds,
  FluidScrollerConfigOverride,
} from '../../../../../types';
import getValueFromDistance from './get-value-from-distance';
import dampenValueByTime from './dampen-value-by-time';
import minScroll from './min-scroll';

type Args = {|
  configOverride?: FluidScrollerConfigOverride,
  distanceToEdge: number,
  dragStartTime: number,
  shouldUseTimeDampening: boolean,
  thresholds: DistanceThresholds,
|};

export default ({
  configOverride,
  distanceToEdge,
  dragStartTime,
  shouldUseTimeDampening,
  thresholds,
}: Args): number => {
  const scroll: number = getValueFromDistance(
    distanceToEdge,
    thresholds,
    configOverride,
  );

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

  return Math.max(
    dampenValueByTime(scroll, dragStartTime, configOverride),
    minScroll,
  );
};
