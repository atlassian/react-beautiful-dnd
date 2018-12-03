// @flow
import type { Rect } from 'css-box-model';
import config from '../../config';
import type { Axis } from '../../../../../types';

// all in pixels
export type DistanceThresholds = {|
  startFrom: number,
  maxSpeedAt: number,
|};

// converts the percentages in the config into actual pixel values
export default (container: Rect, axis: Axis): DistanceThresholds => {
  const startFrom: number = container[axis.size] * config.startFrom;
  const maxSpeedAt: number = container[axis.size] * config.maxSpeedAt;

  const thresholds: DistanceThresholds = {
    startFrom,
    maxSpeedAt,
  };

  return thresholds;
};
