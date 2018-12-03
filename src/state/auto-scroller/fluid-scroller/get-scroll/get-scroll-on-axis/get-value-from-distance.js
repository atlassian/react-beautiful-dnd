// @flow
import { type DistanceThresholds } from './get-distance-thresholds';
import getPercentage from '../../get-percentage';
import config from '../../config';

export default (
  distanceToEdge: number,
  thresholds: DistanceThresholds,
): number => {
  const startOfRange: number = thresholds.maxSpeedAt;
  const endOfRange: number = thresholds.startFrom;
  const current: number = thresholds.startFrom - distanceToEdge;

  const percentage: number = config.ease(
    getPercentage({
      startOfRange,
      endOfRange,
      current,
    }),
  );

  const scroll: number = config.maxScrollSpeed * percentage;

  return scroll;
};
