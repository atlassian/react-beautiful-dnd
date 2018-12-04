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

  // eg maxScrollValueAt: 10px
  // eg startScrollingFrom: 100px
  // everything below maxScrollValueAt goes at the max scroll
  // everything above startScrollingFrom does not scroll
  const percentage: number =
    1 -
    getPercentage({
      startOfRange: thresholds.maxScrollValueAt,
      endOfRange: thresholds.startScrollingFrom,
      current: distanceToEdge,
    });

  console.log('thresholds', thresholds);
  console.log('distanceToEdge', distanceToEdge);
  console.log('percentage', percentage);

  // out of bounds, return no scroll
  if (percentage < 0) {
    return 0;
  }

  const scroll: number = config.maxPixelScroll * config.ease(percentage);

  console.log('scroll', scroll);

  return scroll;
};
