// @flow
import type { Rect } from 'css-box-model';
import config from '../../config';
import type { Axis } from '../../../../../types';

// all in pixels
export type DistanceThresholds = {|
  startScrollingFrom: number,
  maxScrollValueAt: number,
|};

// converts the percentages in the config into actual pixel values
export default (container: Rect, axis: Axis): DistanceThresholds => {
  const startScrollingFrom: number =
    container[axis.size] * config.startFromPercentage;
  const maxScrollValueAt: number =
    container[axis.size] * config.maxScrollAtPercentage;

  const thresholds: DistanceThresholds = {
    startScrollingFrom,
    maxScrollValueAt,
  };

  return thresholds;
};
