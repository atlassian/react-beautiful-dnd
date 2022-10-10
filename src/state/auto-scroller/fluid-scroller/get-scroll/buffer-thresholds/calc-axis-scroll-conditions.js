// @flow
import type { Position, Rect, Spacing } from 'css-box-model';
import type {
  Axis,
  AxisScrollConditions,
  ScrollDetails,
  DistanceThresholds,
} from '../../../../../types';

type Args = {|
  axis: Axis,
  center: Position,
  centerInitial: Position,
  container: Rect,
  containerScroll: ScrollDetails,
  distanceToEdges: Spacing,
  bufferMinScroll: number,
  thresholds: DistanceThresholds,
  windowScrollOffset: Position,
|};

export default ({
  axis,
  bufferMinScroll,
  center,
  centerInitial,
  container,
  containerScroll,
  distanceToEdges,
  thresholds,
  windowScrollOffset,
}: Args): AxisScrollConditions => {
  const distanceInsideThresholdEnd =
    distanceToEdges[axis.end] < thresholds.startScrollingFrom;

  const centerInsideThresholdEnd =
    center[axis.line] >
    container[axis.size] -
      thresholds.startScrollingFrom +
      windowScrollOffset[axis.line];

  const inThresholdEnd = centerInsideThresholdEnd || distanceInsideThresholdEnd;

  const inThresholdStart =
    center[axis.line] <
    thresholds.startScrollingFrom + windowScrollOffset[axis.line];

  const draggedTowardsStart =
    center[axis.line] < centerInitial[axis.line] - bufferMinScroll;

  const draggedTowardsEnd =
    center[axis.line] > centerInitial[axis.line] + bufferMinScroll;

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
