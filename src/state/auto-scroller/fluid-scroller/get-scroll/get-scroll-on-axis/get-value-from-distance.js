// @flow
import { type DistanceThresholds } from './get-distance-thresholds';
import getPercentage from '../../get-percentage';
import config from '../../config';

export default (
  distanceToEdge: number,
  thresholds: DistanceThresholds,
): number => {
  // very close to edge - use maximum scroll
  if (distanceToEdge <= thresholds.maxScrollValueAt) {
    return config.maxPixelScroll;
  }

  // too far away to scroll
  if (distanceToEdge > thresholds.startScrollingFrom) {
    return 0;
  }

  // eg startScrollingFrom: 100px
  // eg maxScrollValueAt: 10px
  // everything below maxScrollValueAt goes at the max scroll
  // everything above startScrollingFrom does not scroll
  const percentage: number = getPercentage({
    startOfRange: thresholds.maxScrollValueAt,
    endOfRange: thresholds.startScrollingFrom,
    current: thresholds.startScrollingFrom - distanceToEdge,
  });

  // out of bounds, return no scroll
  if (percentage <= 0) {
    return 0;
  }

  const scroll: number = config.maxPixelScroll * config.ease(percentage);

  return scroll;
};
