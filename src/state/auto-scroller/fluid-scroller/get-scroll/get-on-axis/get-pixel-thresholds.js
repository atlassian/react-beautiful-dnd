// @flow
import type { Rect } from 'css-box-model';
import config from '../../config';
import type { Axis } from '../../../../../types';

export type PixelThresholds = {|
  startFrom: number,
  maxSpeedAt: number,
|};

// converts the percentages in the config into actual pixel values
export default (container: Rect, axis: Axis): PixelThresholds => {
  const startFrom: number = container[axis.size] * config.startFrom;
  const maxSpeedAt: number = container[axis.size] * config.maxSpeedAt;

  const thresholds: PixelThresholds = {
    startFrom,
    maxSpeedAt,
  };

  return thresholds;
};
