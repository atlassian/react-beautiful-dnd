// @flow
import type { Position, Rect, Spacing } from 'css-box-model';
import type { DistanceThresholds, ScrollDetails } from '../../../../types';

type Args = {|
  center: Position,
  centerIntitial: Position,
  container: Rect,
  containerScroll: ScrollDetails,
  scroll: Position,
  thresholdsHorizontal: DistanceThresholds,
  thresholdsVertical: DistanceThresholds,
  distanceToEdges: Spacing,
|};

const THRESHOLD_BUFFER = 24;

export default ({
  center,
  centerIntitial,
  container,
  containerScroll,
  scroll,
  thresholdsHorizontal,
  thresholdsVertical,
  distanceToEdges,
}: Args): Position => {
  const distanceInsideThresholdRight =
    distanceToEdges.right < thresholdsHorizontal.startScrollingFrom;
  const centerInsideThresholdRight =
    center.x >
    container.width - thresholdsHorizontal.startScrollingFrom + window.scrollX;

  const withinThresholdRight =
    centerInsideThresholdRight || distanceInsideThresholdRight;
  const withinThresholdLeft =
    center.x < thresholdsHorizontal.startScrollingFrom + window.scrollX;

  const hasDraggedLeft = center.x < centerIntitial.x - THRESHOLD_BUFFER;
  const hasDraggedRight = center.x > centerIntitial.x + THRESHOLD_BUFFER;

  const hasScrolledLeft = containerScroll.initial.x > containerScroll.current.x;
  const hasScrolledRight =
    containerScroll.initial.x < containerScroll.current.x;

  // stomp on horizontal scroll
  if (withinThresholdLeft) {
    if (!hasDraggedLeft && !hasScrolledRight) {
      scroll.x = 0;
    }
  }
  if (withinThresholdRight) {
    if (!hasDraggedRight && !hasScrolledLeft) {
      scroll.x = 0;
    }
  }

  const distanceInsideThresholdBottom =
    distanceToEdges.bottom < thresholdsVertical.startScrollingFrom;
  const centerInsideThresholdBottom =
    center.y >
    container.height - thresholdsVertical.startScrollingFrom + window.scrollY;

  const withinThresholdBottom =
    centerInsideThresholdBottom || distanceInsideThresholdBottom;
  const withinThresholdTop =
    center.y < thresholdsVertical.startScrollingFrom + window.scrollY;

  const hasDraggedUp = center.y < centerIntitial.y - THRESHOLD_BUFFER;
  const hasDraggedDown = center.y > centerIntitial.y + THRESHOLD_BUFFER;

  const hasScrolledUp = containerScroll.initial.y > containerScroll.current.y;
  const hasScrolledDown = containerScroll.initial.y < containerScroll.current.y;

  // stomp on vertical scroll
  if (withinThresholdTop) {
    if (!hasDraggedUp && !hasScrolledDown) {
      scroll.y = 0;
    }
  }
  if (withinThresholdBottom) {
    if (!hasDraggedDown && !hasScrolledUp) {
      scroll.y = 0;
    }
  }

  return scroll;
};
