// @flow
import type { Position, Rect, Spacing } from 'css-box-model';
import type { DistanceThresholds, ScrollDetails } from '../../../../types';
import { horizontal, vertical } from '../../../axis';

type Args = {|
  center: Position,
  centerInitial: Position,
  container: Rect,
  containerScroll: ScrollDetails,
  scroll: Position,
  thresholdsHorizontal: DistanceThresholds,
  thresholdsVertical: DistanceThresholds,
  distanceToEdges: Spacing,
|};

const THRESHOLD_BUFFER = 24;

const calcScrollConditions = ({
  axis,
  center,
  centerInitial,
  container,
  containerScroll,
  distanceToEdges,
  thresholds,
  windowScrollOffset,
}) => {
  const distanceInsideThresholdEnd =
    distanceToEdges[axis.end] < thresholds.startScrollingFrom;
  const centerInsideThresholdEnd =
    center[axis.line] >
    container[axis.size] - thresholds.startScrollingFrom + windowScrollOffset;

  const inThresholdEnd = centerInsideThresholdEnd || distanceInsideThresholdEnd;
  const inThresholdStart =
    center[axis.line] < thresholds.startScrollingFrom + windowScrollOffset;

  const draggedTowardsStart =
    center[axis.line] < centerInitial[axis.line] - THRESHOLD_BUFFER;
  const draggedTowardsEnd =
    center[axis.line] > centerInitial[axis.line] + THRESHOLD_BUFFER;

  const scrolledTowardsStart =
    containerScroll.initial[axis.line] > containerScroll.current[axis.line];
  const scrolledTowardsEnd =
    containerScroll.initial[axis.line] < containerScroll.current[axis.line];

  return {
    inThresholdStart,
    inThresholdEnd,
    draggedTowardsStart,
    draggedTowardsEnd,
    scrolledTowardsStart,
    scrolledTowardsEnd,
  };
};

const getScrollConditions = ({
  distanceToEdges,
  thresholdsHorizontal,
  thresholdsVertical,
  center,
  centerInitial,
  container,
  containerScroll,
}) => ({
  xAxis: calcScrollConditions({
    axis: horizontal,
    center,
    centerInitial,
    container,
    containerScroll,
    distanceToEdges,
    thresholds: thresholdsHorizontal,
    windowScrollOffset: window.scrollX,
  }),
  yAxis: calcScrollConditions({
    axis: vertical,
    center,
    centerInitial,
    container,
    containerScroll,
    distanceToEdges,
    thresholds: thresholdsVertical,
    windowScrollOffset: window.scrollY,
  }),
});

export default ({
  center,
  centerInitial,
  container,
  containerScroll,
  scroll,
  thresholdsHorizontal,
  thresholdsVertical,
  distanceToEdges,
}: Args): Position => {
  const { xAxis, yAxis } = getScrollConditions({
    distanceToEdges,
    thresholdsHorizontal,
    thresholdsVertical,
    center,
    centerInitial,
    container,
    containerScroll,
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
