// @flow
import type { Spacing } from 'css-box-model';
import type {
  Axis,
  DistanceThresholds,
  FluidScrollerConfigOverride,
} from '../../../../../types';
import getValue from './get-value';

type GetOnAxisArgs = {|
  axis: Axis,
  configOverride?: FluidScrollerConfigOverride,
  distanceToEdges: Spacing,
  dragStartTime: number,
  shouldUseTimeDampening: boolean,
  thresholds: DistanceThresholds,
|};

export default ({
  axis,
  configOverride,
  distanceToEdges,
  dragStartTime,
  shouldUseTimeDampening,
  thresholds,
}: GetOnAxisArgs): number => {
  const isCloserToEnd: boolean =
    distanceToEdges[axis.end] < distanceToEdges[axis.start];

  if (isCloserToEnd) {
    return getValue({
      configOverride,
      distanceToEdge: distanceToEdges[axis.end],
      dragStartTime,
      shouldUseTimeDampening,
      thresholds,
    });
  }

  return (
    -1 *
    getValue({
      configOverride,
      distanceToEdge: distanceToEdges[axis.start],
      dragStartTime,
      shouldUseTimeDampening,
      thresholds,
    })
  );
};
