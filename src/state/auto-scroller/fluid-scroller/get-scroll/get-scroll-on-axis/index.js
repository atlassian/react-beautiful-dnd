// @flow
import type { Spacing } from 'css-box-model';
import type {
  Axis,
  DistanceThresholds,
  FluidScrollerOptions,
} from '../../../../../types';
import getValue from './get-value';

type GetOnAxisArgs = {|
  distanceToEdges: Spacing,
  dragStartTime: number,
  axis: Axis,
  shouldUseTimeDampening: boolean,
  thresholds: DistanceThresholds,
  fluidScrollerOptions?: FluidScrollerOptions,
|};

export default ({
  thresholds,
  distanceToEdges,
  dragStartTime,
  axis,
  shouldUseTimeDampening,
  fluidScrollerOptions,
}: GetOnAxisArgs): number => {
  const isCloserToEnd: boolean =
    distanceToEdges[axis.end] < distanceToEdges[axis.start];

  if (isCloserToEnd) {
    return getValue({
      distanceToEdge: distanceToEdges[axis.end],
      thresholds,
      dragStartTime,
      shouldUseTimeDampening,
      fluidScrollerOptions,
    });
  }

  return (
    -1 *
    getValue({
      distanceToEdge: distanceToEdges[axis.start],
      thresholds,
      dragStartTime,
      shouldUseTimeDampening,
      fluidScrollerOptions,
    })
  );
};
