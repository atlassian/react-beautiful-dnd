// @flow
import type { Rect, Spacing } from 'css-box-model';
import { type DistanceThresholds } from './get-distance-thresholds';
import type { Axis } from '../../../../../types';
import getValue from './get-value';

type GetOnAxisArgs = {|
  container: Rect,
  distanceToEdges: Spacing,
  dragStartTime: number,
  axis: Axis,
  shouldUseTimeDampening: boolean,
  thresholds: DistanceThresholds,
|};

export default ({
  thresholds,
  distanceToEdges,
  dragStartTime,
  axis,
  shouldUseTimeDampening,
}: GetOnAxisArgs): number => {
  const isCloserToEnd: boolean =
    distanceToEdges[axis.end] < distanceToEdges[axis.start];

  if (isCloserToEnd) {
    return getValue({
      distanceToEdge: distanceToEdges[axis.end],
      thresholds,
      dragStartTime,
      shouldUseTimeDampening,
    });
  }

  return (
    -1 *
    getValue({
      distanceToEdge: distanceToEdges[axis.start],
      thresholds,
      dragStartTime,
      shouldUseTimeDampening,
    })
  );
};
