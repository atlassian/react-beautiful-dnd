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
  thresholds: DistanceThresholds,
  windowScrollOffset: number,
|};

const THRESHOLD_BUFFER = 24;

export default ({
  axis,
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
