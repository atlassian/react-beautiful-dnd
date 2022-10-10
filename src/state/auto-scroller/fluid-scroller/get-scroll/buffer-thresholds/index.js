// @flow
import type { Position, Rect, Spacing } from 'css-box-model';
import type { DistanceThresholds, ScrollDetails } from '../../../../../types';
import getScrollConditions from './get-scroll-conditions';

const BUFFER_MIN_SCROLL_DEFAULT = 24;

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
  windowScrollOffset: Position,
|};

export default ({
  bufferMinScroll = BUFFER_MIN_SCROLL_DEFAULT,
  center,
  centerInitial,
  container,
  containerScroll,
  distanceToEdges,
  scroll,
  thresholdsHorizontal,
  thresholdsVertical,
  windowScrollOffset,
}: Args): Position => {
  const { xAxis, yAxis } = getScrollConditions({
    bufferMinScroll,
    center,
    centerInitial,
    container,
    containerScroll,
    distanceToEdges,
    thresholdsHorizontal,
    thresholdsVertical,
    windowScrollOffset,
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
