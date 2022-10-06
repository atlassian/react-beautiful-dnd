// @flow
import type { Rect } from 'css-box-model';
import config from '../../config';
import type {
  Axis,
  DistanceThresholds,
  FluidScrollerConfigOverride,
} from '../../../../../types';

// converts the percentages in the config (or override) into actual pixel values
export default (
  container: Rect,
  axis: Axis,
  configOverride?: FluidScrollerConfigOverride,
): DistanceThresholds => {
  const startFromPercentage =
    configOverride?.startFromPercentage || config.startFromPercentage;

  const maxScrollAtPercentage =
    configOverride?.maxScrollAtPercentage || config.maxScrollAtPercentage;

  const startScrollingFrom: number = container[axis.size] * startFromPercentage;
  const maxScrollValueAt: number = container[axis.size] * maxScrollAtPercentage;

  const thresholds: DistanceThresholds = {
    startScrollingFrom,
    maxScrollValueAt,
  };

  return thresholds;
};
