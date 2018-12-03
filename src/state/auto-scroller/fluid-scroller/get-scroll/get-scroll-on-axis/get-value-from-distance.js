// @flow
import { type PixelThresholds } from './get-pixel-thresholds';
import getPercentage from '../../get-percentage';
import config from '../../config';

export default (
  distanceToEdge: number,
  thresholds: PixelThresholds,
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

  const speed: number = config.maxScrollSpeed * percentage;

  return speed;
};
