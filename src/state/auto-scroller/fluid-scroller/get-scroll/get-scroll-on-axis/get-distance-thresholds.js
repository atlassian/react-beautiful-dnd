// @flow
import type { Rect } from 'css-box-model';
import config from '../../config';
import type {
  Axis,
  DistanceThresholds,
  FluidScrollerOptions,
} from '../../../../../types';

// converts the percentages in the config (or override) into actual pixel values
export default (
  container: Rect,
  axis: Axis,
  fluidScrollerOptions?: FluidScrollerOptions,
): DistanceThresholds => {
  // added warning suppression for optional chaining in .flowconfig, should we?
  const startFromPercentage =
    fluidScrollerOptions?.configOverride?.startFromPercentage ||
    config.startFromPercentage;

  const maxScrollAtPercentage =
    fluidScrollerOptions?.configOverride?.maxScrollAtPercentage ||
    config.maxScrollAtPercentage;

  const startScrollingFrom: number = container[axis.size] * startFromPercentage;
  const maxScrollValueAt: number = container[axis.size] * maxScrollAtPercentage;

  const thresholds: DistanceThresholds = {
    startScrollingFrom,
    maxScrollValueAt,
  };

  return thresholds;
};
