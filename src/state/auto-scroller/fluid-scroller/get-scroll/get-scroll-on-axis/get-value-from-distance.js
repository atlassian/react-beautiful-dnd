// @flow
import type {
  DistanceThresholds,
  FluidScrollerConfigOverride,
} from '../../../../../types';
import getPercentage from '../../get-percentage';
import config from '../../config';
import minScroll from './min-scroll';

export default (
  distanceToEdge: number,
  thresholds: DistanceThresholds,
  configOverride?: FluidScrollerConfigOverride,
): number => {
  /*
  // This function only looks at the distance to one edge
  // Example: looking at bottom edge
  |----------------------------------|
  |                                  |
  |                                  |
  |                                  |
  |                                  |
  |                                  | => no scroll in this range
  |                                  |
  |                                  |
  |  startScrollingFrom (eg 100px)   |
  |                                  |
  |                                  | => increased scroll value the closer to maxScrollValueAt
  |  maxScrollValueAt (eg 10px)      |
  |                                  | => max scroll value in this range
  |----------------------------------|
  */

  // too far away to auto scroll
  if (distanceToEdge > thresholds.startScrollingFrom) {
    return 0;
  }

  const maxSpeed = configOverride?.maxPixelScroll || config.maxPixelScroll;

  // use max speed when on or over boundary
  if (distanceToEdge <= thresholds.maxScrollValueAt) {
    return maxSpeed;
  }

  // when just going on the boundary return the minimum integer
  if (distanceToEdge === thresholds.startScrollingFrom) {
    return minScroll;
  }

  // to get the % past startScrollingFrom we will calculate
  // the % the value is from maxScrollValueAt and then invert it
  const percentageFromMaxScrollValueAt: number = getPercentage({
    startOfRange: thresholds.maxScrollValueAt,
    endOfRange: thresholds.startScrollingFrom,
    current: distanceToEdge,
  });

  const percentageFromStartScrollingFrom: number =
    1 - percentageFromMaxScrollValueAt;

  const scroll: number =
    maxSpeed * config.ease(percentageFromStartScrollingFrom);

  // scroll will always be a positive integer
  return Math.ceil(scroll);
};
