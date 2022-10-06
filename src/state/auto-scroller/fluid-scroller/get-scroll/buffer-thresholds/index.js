// @flow
import type { Position, Rect, Spacing } from 'css-box-model';
import type { DistanceThresholds, ScrollDetails } from '../../../../../types';
import getScrollConditions from './get-scroll-conditions';

type Args = {|
  center: Position,
  centerInitial: Position,
  container: Rect,
  containerScroll: ScrollDetails,
  distanceToEdges: Spacing,
  bufferMinScroll?: number,
  scroll: Position,
  thresholdsHorizontal: DistanceThresholds,
  thresholdsVertical: DistanceThresholds,
|};

export default ({
  center,
  centerInitial,
  container,
  containerScroll,
  distanceToEdges,
  bufferMinScroll = 24,
  scroll,
  thresholdsHorizontal,
  thresholdsVertical,
}: Args): Position => {
  const { xAxis, yAxis } = getScrollConditions({
    center,
    centerInitial,
    container,
    containerScroll,
    distanceToEdges,
    bufferMinScroll,
    thresholdsHorizontal,
    thresholdsVertical,
  });

  if (xAxis.inThresholdStart) {
    if (!xAxis.draggedTowardsStart && !xAxis.scrolledTowardsEnd) {
      scroll.x = 0;
    }
  } else if (xAxis.inThresholdEnd) {
    if (!xAxis.draggedTowardsEnd && !xAxis.scrolledTowardsStart) {
      scroll.x = 0;
    }
  }

  if (yAxis.inThresholdStart) {
    if (!yAxis.draggedTowardsStart && !yAxis.scrolledTowardsEnd) {
      scroll.y = 0;
    }
  } else if (yAxis.inThresholdEnd) {
    if (!yAxis.draggedTowardsEnd && !yAxis.scrolledTowardsStart) {
      scroll.y = 0;
    }
  }

  return scroll;
};
